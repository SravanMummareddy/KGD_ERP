'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ─── Validation Schemas ───────────────────────────────────────────

const CustomerSchema = z.object({
    name: z.string().min(1, 'Contact person name is required'),
    businessName: z.string().optional(),
    phone: z.string().optional(),
    secondaryPhone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().optional(),
    defaultDiscount: z.coerce.number().min(0).max(100).optional(),
})

const ContactSchema = z.object({
    name: z.string().min(1, 'Contact name is required'),
    phone: z.string().optional(),
    role: z.string().optional(),
    isPrimary: z.coerce.boolean().optional(),
    notes: z.string().optional(),
})

// ─── Create Customer ──────────────────────────────────────────────

export async function createCustomer(formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const parsed = CustomerSchema.safeParse({
        name: formData.get('name'),
        businessName: formData.get('businessName'),
        phone: formData.get('phone'),
        secondaryPhone: formData.get('secondaryPhone'),
        address: formData.get('address'),
        city: formData.get('city'),
        notes: formData.get('notes'),
        defaultDiscount: formData.get('defaultDiscount') || undefined,
    })

    if (!parsed.success) throw new Error(parsed.error.issues[0].message)

    const customer = await prisma.customer.create({
        data: {
            name: parsed.data.name,
            businessName: parsed.data.businessName || null,
            phone: parsed.data.phone || null,
            secondaryPhone: parsed.data.secondaryPhone || null,
            address: parsed.data.address || null,
            city: parsed.data.city || null,
            notes: parsed.data.notes || null,
            defaultDiscount: parsed.data.defaultDiscount ?? null,
        },
    })

    await writeAuditLog({
        entity: 'Customer', entityId: customer.id, action: 'CREATE',
        performedBy: session.user.id,
        newValues: { name: customer.name, businessName: customer.businessName, city: customer.city },
    })

    revalidatePath('/customers')
    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    redirect(`/customers/${customer.id}`)
}

// ─── Update Customer ──────────────────────────────────────────────

export async function updateCustomer(customerId: string, formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const parsed = CustomerSchema.safeParse({
        name: formData.get('name'),
        businessName: formData.get('businessName'),
        phone: formData.get('phone'),
        secondaryPhone: formData.get('secondaryPhone'),
        address: formData.get('address'),
        city: formData.get('city'),
        notes: formData.get('notes'),
        defaultDiscount: formData.get('defaultDiscount') || undefined,
    })

    if (!parsed.success) throw new Error(parsed.error.issues[0].message)

    const old = await prisma.customer.findUnique({ where: { id: customerId } })

    const customer = await prisma.customer.update({
        where: { id: customerId },
        data: {
            name: parsed.data.name,
            businessName: parsed.data.businessName || null,
            phone: parsed.data.phone || null,
            secondaryPhone: parsed.data.secondaryPhone || null,
            address: parsed.data.address || null,
            city: parsed.data.city || null,
            notes: parsed.data.notes || null,
            defaultDiscount: parsed.data.defaultDiscount ?? null,
        },
    })

    await writeAuditLog({
        entity: 'Customer', entityId: customer.id, action: 'UPDATE',
        performedBy: session.user.id,
        oldValues: { name: old?.name, businessName: old?.businessName, city: old?.city, phone: old?.phone },
        newValues: { name: customer.name, businessName: customer.businessName, city: customer.city, phone: customer.phone },
    })

    // Revalidate all pages that may display customer data
    revalidatePath(`/customers/${customerId}`)
    revalidatePath('/customers')
    revalidatePath('/invoices')
    revalidatePath('/payments')
    revalidatePath('/dashboard')
    redirect(`/customers/${customerId}`)
}

// ─── Add Contact ──────────────────────────────────────────────────

export async function addContact(customerId: string, formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const parsed = ContactSchema.safeParse({
        name: formData.get('name'),
        phone: formData.get('phone') || undefined,
        role: formData.get('role') || undefined,
        isPrimary: formData.get('isPrimary') === 'on',
        notes: formData.get('notes') || undefined,
    })

    if (!parsed.success) throw new Error(parsed.error.issues[0].message)

    // If setting primary, unset existing primary
    if (parsed.data.isPrimary) {
        await prisma.customerContact.updateMany({
            where: { customerId },
            data: { isPrimary: false },
        })
    }

    await prisma.customerContact.create({
        data: {
            customerId,
            name: parsed.data.name,
            phone: parsed.data.phone || null,
            role: parsed.data.role || null,
            isPrimary: parsed.data.isPrimary ?? false,
            notes: parsed.data.notes || null,
        },
    })

    revalidatePath(`/customers/${customerId}`)
}

// ─── Delete Contact ───────────────────────────────────────────────

export async function deleteContact(contactId: string, customerId: string): Promise<void> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Not authorized')
    await prisma.customerContact.delete({ where: { id: contactId } })
    revalidatePath(`/customers/${customerId}`)
}

// ─── Delete Customer (soft delete) ───────────────────────────────

export async function deleteCustomer(customerId: string): Promise<{ error?: string }> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') return { error: 'Not authorized' }

    // Business rule: block delete if customer has outstanding invoices
    const unpaidCount = await prisma.invoice.count({
        where: { customerId, status: { in: ['UNPAID', 'PARTIAL'] } },
    })
    if (unpaidCount > 0) {
        return { error: `Cannot delete: customer has ${unpaidCount} unpaid invoice(s). Settle all invoices first.` }
    }

    const old = await prisma.customer.findUnique({ where: { id: customerId } })

    try {
        await prisma.customer.update({
            where: { id: customerId },
            data: { isActive: false, deletedAt: new Date(), deletedById: session.user.id } as object,
        })
    } catch {
        // Prisma client not regenerated yet — fall back to just isActive
        await prisma.customer.update({ where: { id: customerId }, data: { isActive: false } })
    }

    await writeAuditLog({
        entity: 'Customer', entityId: customerId, action: 'DELETE',
        performedBy: session.user.id,
        oldValues: { name: old?.name, businessName: old?.businessName },
        newValues: { isActive: false, deletedAt: new Date().toISOString() },
    })

    revalidatePath('/customers')
    revalidatePath('/dashboard')
    revalidatePath('/admin/deleted')
    return {}
}

// ─── Restore Customer ─────────────────────────────────────────────

export async function restoreCustomer(customerId: string): Promise<{ error?: string }> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') return { error: 'Not authorized' }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) return { error: 'Customer not found' }

    try {
        await prisma.customer.update({
            where: { id: customerId },
            data: { isActive: true, deletedAt: null, deletedById: null } as object,
        })
    } catch {
        await prisma.customer.update({ where: { id: customerId }, data: { isActive: true } })
    }

    await writeAuditLog({
        entity: 'Customer', entityId: customerId, action: 'RESTORE',
        performedBy: session.user.id,
        newValues: { name: customer.name, businessName: customer.businessName, restoredAt: new Date().toISOString() },
    })

    revalidatePath('/customers')
    revalidatePath('/admin/deleted')
    revalidatePath('/dashboard')
    return {}
}

// ─── Permanent Delete Customer (ADMIN only) ───────────────────────

export async function permanentDeleteCustomer(customerId: string): Promise<{ error?: string }> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') return { error: 'Not authorized' }

    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { invoices: { take: 1 }, payments: { take: 1 } },
    })
    if (!customer) return { error: 'Customer not found' }
    if (customer.invoices.length > 0 || customer.payments.length > 0) {
        return { error: 'Cannot permanently delete: customer has financial records. Use soft delete instead.' }
    }

    await writeAuditLog({
        entity: 'Customer', entityId: customerId, action: 'DELETE',
        performedBy: session.user.id,
        oldValues: { name: customer.name, businessName: customer.businessName, permanentDelete: true },
    })

    await prisma.customer.delete({ where: { id: customerId } })

    revalidatePath('/customers')
    revalidatePath('/admin/deleted')
    revalidatePath('/dashboard')
    return {}
}
