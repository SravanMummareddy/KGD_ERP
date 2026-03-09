'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addInventoryItem(formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const unit = formData.get('unit') as string
    const currentStock = parseFloat((formData.get('currentStock') as string) || '0')

    if (!name) throw new Error('Name is required')

    await prisma.inventoryItem.create({ data: { name, category: category || 'General', unit: unit || 'kg', currentStock } })
    revalidatePath('/inventory')
}

export async function addInventoryTransaction(formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const inventoryItemId = formData.get('inventoryItemId') as string
    const type = formData.get('type') as 'PURCHASE' | 'ADJUSTMENT' | 'USAGE'
    const quantity = parseFloat((formData.get('quantity') as string) || '0')
    const rate = parseFloat((formData.get('rate') as string) || '0') || undefined
    const notes = formData.get('notes') as string

    if (!inventoryItemId || !quantity) throw new Error('Item and quantity are required')

    const qty = type === 'USAGE' ? -Math.abs(quantity) : Math.abs(quantity)

    await prisma.$transaction([
        prisma.inventoryTransaction.create({
            data: {
                inventoryItemId,
                type,
                quantity: qty,
                rate: rate || null,
                totalCost: rate ? Math.abs(qty) * rate : null,
                notes: notes || null,
                createdById: session.user.id,
            },
        }),
        prisma.inventoryItem.update({
            where: { id: inventoryItemId },
            data: { currentStock: { increment: qty } },
        }),
    ])

    await writeAuditLog({
        entity: 'Inventory', entityId: inventoryItemId, action: 'UPDATE',
        performedBy: session.user.id,
        newValues: { type, quantity: qty, notes },
    })

    revalidatePath('/inventory')
}
