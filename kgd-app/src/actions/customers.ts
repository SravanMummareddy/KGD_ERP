'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ─── Validation Schemas ───────────────────────────────────────────

const CustomerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    businessName: z.string().optional(),
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
            address: parsed.data.address || null,
            city: parsed.data.city || null,
            notes: parsed.data.notes || null,
            defaultDiscount: parsed.data.defaultDiscount ?? null,
        },
    })

    await writeAuditLog({
        entity: 'Customer', entityId: customer.id, action: 'CREATE',
        performedBy: session.user.id,
        newValues: { name: customer.name, city: customer.city },
    })

    revalidatePath('/customers')
    redirect(`/customers/${customer.id}`)
}

// ─── Update Customer ──────────────────────────────────────────────

export async function updateCustomer(customerId: string, formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const parsed = CustomerSchema.safeParse({
        name: formData.get('name'),
        businessName: formData.get('businessName'),
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
            address: parsed.data.address || null,
            city: parsed.data.city || null,
            notes: parsed.data.notes || null,
            defaultDiscount: parsed.data.defaultDiscount ?? null,
        },
    })

    await writeAuditLog({
        entity: 'Customer', entityId: customer.id, action: 'UPDATE',
        performedBy: session.user.id,
        oldValues: { name: old?.name, city: old?.city },
        newValues: { name: customer.name, city: customer.city },
    })

    revalidatePath(`/customers/${customerId}`)
    revalidatePath('/customers')
    redirect(`/customers/${customerId}`)
}

// ─── Add Contact ──────────────────────────────────────────────────

export async function addContact(customerId: string, formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const parsed = ContactSchema.safeParse({
        name: formData.get('name'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        isPrimary: formData.get('isPrimary') === 'on',
        notes: formData.get('notes'),
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

// ─── Deactivate Customer (soft delete) ───────────────────────────

export async function deactivateCustomer(customerId: string): Promise<void> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Not authorized')

    await prisma.customer.update({
        where: { id: customerId },
        data: { isActive: false },
    })

    await writeAuditLog({
        entity: 'Customer', entityId: customerId, action: 'DELETE',
        performedBy: session.user.id,
        newValues: { isActive: false },
    })

    revalidatePath('/customers')
    redirect('/customers')
}
