'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Invoice creation ─────────────────────────────────────────────

export async function createInvoice(formData: FormData) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    // Session JWT can become stale after DB reset/reseed.
    let actorId = session.user.id
    let actor = await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } })
    if (!actor && session.user.email) {
        actor = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
        if (actor) actorId = actor.id
    }
    if (!actor) redirect('/login')

    const customerId = formData.get('customerId') as string
    const invoiceDate = formData.get('invoiceDate') as string
    const dueDate = formData.get('dueDate') as string
    const discountAmount = parseFloat((formData.get('discountAmount') as string) || '0')
    const remarks = formData.get('remarks') as string
    const applyCreditStr = formData.get('applyCredit') as string

    // Parse line items — sent as JSON string from client component
    const itemsJson = formData.get('items') as string
    let items: Array<{
        productId?: string
        description: string
        quantity: number
        unit: string
        rate: number
        remarks?: string
    }> = []

    try {
        items = JSON.parse(itemsJson)
    } catch {
        return { error: 'Invalid line items' }
    }

    if (!customerId) return { error: 'Customer is required' }
    if (items.length === 0) return { error: 'At least one item is required' }
    for (const item of items) {
        if (!item.description) return { error: 'All items must have a description' }
        if (item.quantity <= 0) return { error: 'Quantity must be greater than 0' }
        if (item.rate < 0) return { error: 'Rate cannot be negative' }
    }

    // Compute amounts
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0)
    const totalAmount = Math.max(0, subtotal - discountAmount)

    // Apply advance credit if requested
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    const availableCredit = Number(customer?.creditBalance ?? 0)
    const applyCredit = applyCreditStr === 'true' || applyCreditStr === 'on'
    const creditApplied = applyCredit ? Math.min(availableCredit, totalAmount) : 0
    const balanceDue = totalAmount - creditApplied

    // Generate invoice number
    const year = new Date().getFullYear()
    const lastInvoice = await prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith: `KGD-${year}-` } },
        orderBy: { invoiceNumber: 'desc' },
    })

    let seq = 1
    if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split('-')
        seq = parseInt(parts[parts.length - 1]) + 1
    }

    const invoiceNumber = `KGD-${year}-${String(seq).padStart(4, '0')}`

    const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const inv = await tx.invoice.create({
            data: {
                invoiceNumber,
                customerId,
                invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : null,
                subtotal,
                discountAmount,
                totalAmount,
                paidAmount: creditApplied,
                balanceDue,
                status: balanceDue <= 0 ? 'PAID' : creditApplied > 0 ? 'PARTIAL' : 'UNPAID',
                remarks: remarks || null,
                createdById: actorId,
                items: {
                    create: items.map((item, idx) => ({
                        productId: item.productId || null,
                        description: item.description,
                        quantity: item.quantity,
                        unit: item.unit || 'packet',
                        rate: item.rate,
                        amount: item.quantity * item.rate,
                        remarks: item.remarks || null,
                        sortOrder: idx,
                    })),
                },
            },
        })

        // Deduct inventory pieces
        for (const item of items) {
            if (item.productId) {
                const qty = Number(item.quantity)
                const piecesToDeduct = item.unit.toLowerCase() === 'packet' ? qty * 14 : qty
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockPieces: { decrement: piecesToDeduct } }
                })
            }
        }

        // Deduct credit from customer if applied
        if (creditApplied > 0) {
            await tx.customer.update({
                where: { id: customerId },
                data: { creditBalance: { decrement: creditApplied } },
            })
        }

        return inv
    })

    await writeAuditLog({
        entity: 'Invoice', entityId: invoice.id, action: 'CREATE',
        performedBy: actorId,
        newValues: { invoiceNumber, customerId, totalAmount, creditApplied, status: invoice.status },
    })

    revalidatePath('/invoices')
    revalidatePath('/customers')
    revalidatePath(`/customers/${customerId}`)
    revalidatePath('/dashboard')
    redirect(`/invoices/${invoice.id}`)
}

// ─── Cancel invoice (admin only) ─────────────────────────────────

export async function cancelInvoice(invoiceId: string): Promise<void> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Not authorized')
    }

    let actorId = session.user.id
    let actor = await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } })
    if (!actor && session.user.email) {
        actor = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
        if (actor) actorId = actor.id
    }
    if (!actor) redirect('/login')

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { allocations: true },
    })

    if (!invoice) throw new Error('Invoice not found')
    if (invoice.status === 'CANCELLED') return

    const oldStatus = invoice.status
    const oldPaidAmount = Number(invoice.paidAmount)

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Reverse all payment allocations for this invoice
        const affectedPaymentIds = invoice.allocations.map((a: { paymentId: string }) => a.paymentId)

        // Delete all allocations for this invoice
        await tx.paymentAllocation.deleteMany({ where: { invoiceId } })

        // 2. For each affected payment, recalculate how much is allocated elsewhere
        //    and if there's leftover, add it back to customer credit
        for (const paymentId of affectedPaymentIds) {
            const payment = await tx.payment.findUnique({
                where: { id: paymentId },
                include: { allocations: true },
            })
            if (!payment) continue

            const remainingAllocated = payment.allocations.reduce((s: number, a: { amount: unknown }) => s + Number(a.amount), 0)
            const unallocated = Number(payment.amount) - remainingAllocated

            if (unallocated > 0) {
                await tx.customer.update({
                    where: { id: invoice.customerId },
                    data: { creditBalance: { increment: unallocated } },
                })
            }
        }

        // 3. Mark the invoice as CANCELLED and reset balances
        await tx.invoice.update({
            where: { id: invoiceId },
            data: {
                status: 'CANCELLED',
                paidAmount: 0,
                balanceDue: Number(invoice.totalAmount),
            },
        })

        // 4. Restore inventory pieces
        const invoiceItems = await tx.invoiceItem.findMany({ where: { invoiceId } })
        for (const item of invoiceItems) {
            if (item.productId) {
                const qty = Number(item.quantity)
                const piecesToRestore = item.unit.toLowerCase() === 'packet' ? qty * 14 : qty
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockPieces: { increment: piecesToRestore } }
                })
            }
        }
    })

    await writeAuditLog({
        entity: 'Invoice', entityId: invoiceId, action: 'UPDATE',
        performedBy: actorId,
        oldValues: { status: oldStatus, paidAmount: oldPaidAmount },
        newValues: { status: 'CANCELLED', paidAmount: 0 },
    })

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/customers')
    revalidatePath(`/customers/${invoice.customerId}`)
    revalidatePath('/dashboard')
}
