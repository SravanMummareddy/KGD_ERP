'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const ProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    type: z.enum(['PLATE', 'SHEET']),
    sizeInches: z.coerce.number().positive().optional(),
    gsm: z.coerce.number().int().positive().optional(),
    color: z.string().optional(),
    unitLabel: z.string().default('packet'),
    defaultRate: z.coerce.number().min(0).optional(),
    description: z.string().optional(),
})

export async function createProduct(formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const parsed = ProductSchema.safeParse({
        name: formData.get('name'),
        type: formData.get('type'),
        sizeInches: formData.get('sizeInches') || undefined,
        gsm: formData.get('gsm') || undefined,
        color: formData.get('color'),
        unitLabel: formData.get('unitLabel') || 'packet',
        defaultRate: formData.get('defaultRate') || undefined,
        description: formData.get('description'),
    })

    if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message)
    }

    const product = await prisma.product.create({
        data: {
            name: parsed.data.name,
            type: parsed.data.type,
            sizeInches: parsed.data.sizeInches ?? null,
            gsm: parsed.data.gsm ?? null,
            color: parsed.data.color || null,
            unitLabel: parsed.data.unitLabel,
            defaultRate: parsed.data.defaultRate ?? null,
            description: parsed.data.description || null,
        },
    })

    await writeAuditLog({
        entity: 'Product', entityId: product.id, action: 'CREATE',
        performedBy: session.user.id, newValues: { name: product.name },
    })

    revalidatePath('/products')
    redirect('/products')
}

export async function updateProduct(productId: string, formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const parsed = ProductSchema.safeParse({
        name: formData.get('name'),
        type: formData.get('type'),
        sizeInches: formData.get('sizeInches') || undefined,
        gsm: formData.get('gsm') || undefined,
        color: formData.get('color'),
        unitLabel: formData.get('unitLabel') || 'packet',
        defaultRate: formData.get('defaultRate') || undefined,
        description: formData.get('description'),
    })

    if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message)
    }

    await prisma.product.update({
        where: { id: productId },
        data: {
            name: parsed.data.name,
            type: parsed.data.type,
            sizeInches: parsed.data.sizeInches ?? null,
            gsm: parsed.data.gsm ?? null,
            color: parsed.data.color || null,
            unitLabel: parsed.data.unitLabel,
            defaultRate: parsed.data.defaultRate ?? null,
            description: parsed.data.description || null,
        },
    })

    revalidatePath('/products')
    redirect('/products')
}

export async function adjustStock(
    productId: string,
    type: 'IN' | 'OUT',
    packets: number,
    loose: number,
    reason: string
): Promise<void> {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const piecesToMove = (packets * 14) + loose
    if (piecesToMove <= 0) throw new Error('Quantity must be greater than 0')

    const oldProduct = await prisma.product.findUnique({ where: { id: productId } })
    if (!oldProduct) throw new Error('Product not found')
    
    // Don't allow negative inventory
    if (type === 'OUT' && oldProduct.stockPieces < piecesToMove) {
        throw new Error('Not enough stock available')
    }

    const newProduct = await prisma.product.update({
        where: { id: productId },
        data: {
            stockPieces: type === 'IN' 
                ? { increment: piecesToMove }
                : { decrement: piecesToMove }
        }
    })

    await writeAuditLog({
        entity: 'Product',
        entityId: productId,
        action: 'UPDATE',
        performedBy: session.user.id,
        oldValues: { stockPieces: oldProduct.stockPieces },
        newValues: { stockPieces: newProduct.stockPieces, piecesMoved: piecesToMove, type, reason }
    })

    revalidatePath('/products')
}
