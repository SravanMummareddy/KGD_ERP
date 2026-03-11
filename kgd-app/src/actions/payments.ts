'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const EditReasonSchema = z.enum([
    'Correction',
    'Duplicate Entry',
    'Customer Adjustment',
    'Refund',
    'Other',
])

export async function recordPayment(formData: FormData) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    let actorId = session.user.id
    let actor = await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } })
    if (!actor && session.user.email) {
        actor = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
        if (actor) actorId = actor.id
    }
    if (!actor) redirect('/login')

    const customerId = formData.get('customerId') as string
    const amount = parseFloat(formData.get('amount') as string)
    const paymentDate = formData.get('paymentDate') as string
    const method = (formData.get('method') as string) || 'CASH'
    const reference = formData.get('reference') as string
    const notes = formData.get('notes') as string

    if (!customerId) throw new Error('Customer is required')
    if (!amount || amount <= 0) throw new Error('Payment amount must be greater than 0')

    const invoiceIds = formData
        .getAll('invoiceIds')
        .map((v) => String(v).trim())
        .filter(Boolean)

    // Create the payment
    const payment = await prisma.payment.create({
        data: {
            customerId,
            amount,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            method: method as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER',
            reference: reference || null,
            notes: notes || null,
            createdById: actorId,
        },
    })

    // Allocate against invoices oldest-first
    let remaining = amount
    const invoices = await prisma.invoice.findMany({
        where: {
            customerId,
            status: { in: ['UNPAID', 'PARTIAL'] },
            ...(invoiceIds.length > 0 ? { id: { in: invoiceIds } } : {}),
        },
        orderBy: { invoiceDate: 'asc' },
    })

    for (const inv of invoices) {
        if (remaining <= 0) break
        const due = Number(inv.balanceDue)
        const allocate = Math.min(remaining, due)
        if (allocate <= 0) continue

        await prisma.paymentAllocation.create({
            data: { paymentId: payment.id, invoiceId: inv.id, amount: allocate },
        })

        const newPaid = Number(inv.paidAmount) + allocate
        const newBalance = Number(inv.totalAmount) - newPaid
        const newStatus =
            newBalance <= 0 ? 'PAID' :
                newPaid > 0 ? 'PARTIAL' :
                    'UNPAID'

        await prisma.invoice.update({
            where: { id: inv.id },
            data: {
                paidAmount: newPaid,
                balanceDue: Math.max(0, newBalance),
                status: newStatus,
            },
        })

        remaining -= allocate
    }

    // If any amount is left over, store as customer credit (advance)
    if (remaining > 0) {
        await prisma.customer.update({
            where: { id: customerId },
            data: { creditBalance: { increment: remaining } },
        })
    }

    await writeAuditLog({
        entity: 'Payment', entityId: payment.id, action: 'CREATE',
        performedBy: actorId,
        newValues: { customerId, amount, method, invoiceIds, creditStored: remaining > 0 ? remaining : undefined },
    })

    revalidatePath('/payments')
    revalidatePath('/invoices')
    revalidatePath('/customers')
    revalidatePath(`/customers/${customerId}`)
    revalidatePath('/dashboard')
    redirect(`/customers/${customerId}`)
}

// ─── Update Payment ───────────────────────────────────────────────

export async function updatePayment(paymentId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    let actorId = session.user.id
    let actor = await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } })
    if (!actor && session.user.email) {
        actor = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
        if (actor) actorId = actor.id
    }
    if (!actor) redirect('/login')

    const newAmount = parseFloat(formData.get('amount') as string)
    const paymentDate = formData.get('paymentDate') as string
    const method = (formData.get('method') as string) || 'CASH'
    const reference = formData.get('reference') as string
    const notes = formData.get('notes') as string
    const reasonRaw = formData.get('reason') as string
    const reasonOther = formData.get('reasonOther') as string
    const reason = reasonRaw === 'Other' ? (reasonOther || 'Other') : reasonRaw

    if (!newAmount || newAmount <= 0) throw new Error('Payment amount must be greater than 0')

    const oldPayment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { allocations: { include: { invoice: true } } },
    })
    if (!oldPayment) throw new Error('Payment not found')

    const customerId = oldPayment.customerId
    const oldAmount = Number(oldPayment.amount)

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Reverse all existing allocations
        for (const alloc of oldPayment.allocations) {
            const inv = alloc.invoice
            const revertPaid = Number(inv.paidAmount) - Number(alloc.amount)
            const revertBalance = Number(inv.totalAmount) - revertPaid
            await tx.invoice.update({
                where: { id: inv.id },
                data: {
                    paidAmount: Math.max(0, revertPaid),
                    balanceDue: Math.max(0, revertBalance),
                    status: revertPaid <= 0 ? 'UNPAID' : 'PARTIAL',
                },
            })
        }
        await tx.paymentAllocation.deleteMany({ where: { paymentId } })

        // 2. If old payment had contributed to creditBalance, deduct that
        //    (We approximate: old remaining = oldAmount - allocated. Remove from credit)
        const oldAllocated = oldPayment.allocations.reduce((s: number, a: { amount: unknown }) => s + Number(a.amount), 0)
        const oldCredit = oldAmount - oldAllocated
        if (oldCredit > 0) {
            await tx.customer.update({
                where: { id: customerId },
                data: { creditBalance: { decrement: oldCredit } },
            })
        }

        // 3. Update the payment record
        await tx.payment.update({
            where: { id: paymentId },
            data: {
                amount: newAmount,
                paymentDate: paymentDate ? new Date(paymentDate) : oldPayment.paymentDate,
                method: method as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER',
                reference: reference || null,
                notes: notes || null,
            },
        })

        // 4. Re-allocate to open invoices
        let remaining = newAmount
        const openInvoices = await tx.invoice.findMany({
            where: { customerId, status: { in: ['UNPAID', 'PARTIAL'] } },
            orderBy: { invoiceDate: 'asc' },
        })

        for (const inv of openInvoices) {
            if (remaining <= 0) break
            const due = Number(inv.balanceDue)
            const allocate = Math.min(remaining, due)
            if (allocate <= 0) continue

            await tx.paymentAllocation.create({
                data: { paymentId, invoiceId: inv.id, amount: allocate },
            })

            const newPaid = Number(inv.paidAmount) + allocate
            const newBalance = Number(inv.totalAmount) - newPaid
            await tx.invoice.update({
                where: { id: inv.id },
                data: {
                    paidAmount: newPaid,
                    balanceDue: Math.max(0, newBalance),
                    status: newBalance <= 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID',
                },
            })

            remaining -= allocate
        }

        // 5. Store leftover as credit
        if (remaining > 0) {
            await tx.customer.update({
                where: { id: customerId },
                data: { creditBalance: { increment: remaining } },
            })
        }
    })

    await writeAuditLog({
        entity: 'Payment', entityId: paymentId, action: 'UPDATE',
        performedBy: actorId,
        oldValues: { amount: oldAmount, method: oldPayment.method },
        newValues: { amount: newAmount, method, reason, editedBy: actorId },
    })

    revalidatePath('/payments')
    revalidatePath('/invoices')
    revalidatePath('/customers')
    revalidatePath(`/customers/${customerId}`)
    revalidatePath('/dashboard')
    redirect(`/customers/${customerId}`)
}
