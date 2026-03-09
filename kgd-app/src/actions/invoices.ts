'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ─── Invoice creation ─────────────────────────────────────────────

export async function createInvoice(formData: FormData) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const customerId = formData.get('customerId') as string
    const invoiceDate = formData.get('invoiceDate') as string
    const dueDate = formData.get('dueDate') as string
    const discountAmount = parseFloat((formData.get('discountAmount') as string) || '0')
    const remarks = formData.get('remarks') as string

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
    const balanceDue = totalAmount  // no payment at invoice creation

    // Generate invoice number: get last invoice this year
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

    const invoice = await prisma.invoice.create({
        data: {
            invoiceNumber,
            customerId,
            invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
            dueDate: dueDate ? new Date(dueDate) : null,
            subtotal,
            discountAmount,
            totalAmount,
            paidAmount: 0,
            balanceDue,
            status: 'UNPAID',
            remarks: remarks || null,
            createdById: session.user.id,
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

    await writeAuditLog({
        entity: 'Invoice', entityId: invoice.id, action: 'CREATE',
        performedBy: session.user.id,
        newValues: { invoiceNumber, customerId, totalAmount, status: 'UNPAID' },
    })

    revalidatePath('/invoices')
    revalidatePath(`/customers/${customerId}`)
    redirect(`/invoices/${invoice.id}`)
}

// ─── Cancel invoice (admin only) ─────────────────────────────────

export async function cancelInvoice(invoiceId: string): Promise<void> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Not authorized')
    }

    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'CANCELLED' },
    })

    await writeAuditLog({
        entity: 'Invoice', entityId: invoiceId, action: 'UPDATE',
        performedBy: session.user.id,
        newValues: { status: 'CANCELLED' },
    })

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
}
