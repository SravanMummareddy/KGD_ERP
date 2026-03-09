'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function recordPayment(formData: FormData) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const customerId = formData.get('customerId') as string
    const amount = parseFloat(formData.get('amount') as string)
    const paymentDate = formData.get('paymentDate') as string
    const method = (formData.get('method') as string) || 'CASH'
    const reference = formData.get('reference') as string
    const notes = formData.get('notes') as string
    const invoiceIdsRaw = formData.get('invoiceIds') as string  // comma-separated

    if (!customerId) throw new Error('Customer is required')
    if (!amount || amount <= 0) throw new Error('Payment amount must be greater than 0')

    const invoiceIds = invoiceIdsRaw
        ? invoiceIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : []

    // Create the payment
    const payment = await prisma.payment.create({
        data: {
            customerId,
            amount,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            method: method as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER',
            reference: reference || null,
            notes: notes || null,
            createdById: session.user.id,
        },
    })

    // Allocate against invoices
    let remaining = amount
    if (invoiceIds.length > 0) {
        const invoices = await prisma.invoice.findMany({
            where: { id: { in: invoiceIds }, customerId },
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
    }

    await writeAuditLog({
        entity: 'Payment', entityId: payment.id, action: 'CREATE',
        performedBy: session.user.id,
        newValues: { customerId, amount, method, invoiceIds },
    })

    revalidatePath('/payments')
    revalidatePath('/invoices')
    revalidatePath(`/customers/${customerId}`)
    redirect(`/customers/${customerId}`)
}
