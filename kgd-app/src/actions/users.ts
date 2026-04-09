'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const UserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    role: z.enum(['ADMIN', 'STAFF']),
})

// ─── Create User ──────────────────────────────────────────────────

export async function createUser(formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')

    const parsed = UserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
    })
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)

    const password = formData.get('password') as string
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters')

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) throw new Error('A user with this email already exists')

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
        data: {
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            passwordHash,
            isActive: true,
        },
    })

    await writeAuditLog({
        entity: 'User', entityId: user.id, action: 'CREATE',
        performedBy: session.user.id,
        newValues: { name: user.name, email: user.email, role: user.role },
    })

    revalidatePath('/admin/users')
    redirect('/admin/users')
}

// ─── Update User ──────────────────────────────────────────────────

export async function updateUser(userId: string, formData: FormData): Promise<void> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')

    const parsed = UserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
    })
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)

    // Prevent admin from removing their own admin role
    if (userId === session.user.id && parsed.data.role !== 'ADMIN') {
        throw new Error('You cannot change your own role')
    }

    const old = await prisma.user.findUnique({ where: { id: userId } })

    // Check email uniqueness (excluding self)
    const existing = await prisma.user.findFirst({
        where: { email: parsed.data.email, NOT: { id: userId } },
    })
    if (existing) throw new Error('A user with this email already exists')

    const updateData: { name: string; email: string; role: 'ADMIN' | 'STAFF'; passwordHash?: string } = {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
    }

    // Optional password reset
    const newPassword = formData.get('newPassword') as string
    if (newPassword && newPassword.trim().length > 0) {
        if (newPassword.length < 8) throw new Error('Password must be at least 8 characters')
        updateData.passwordHash = await bcrypt.hash(newPassword, 12)
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    })

    await writeAuditLog({
        entity: 'User', entityId: userId, action: 'UPDATE',
        performedBy: session.user.id,
        oldValues: { name: old?.name, email: old?.email, role: old?.role },
        newValues: { name: user.name, email: user.email, role: user.role },
    })

    revalidatePath('/admin/users')
    redirect('/admin/users')
}

// ─── Toggle User Active / Inactive ───────────────────────────────

export async function toggleUserActive(userId: string, currentlyActive: boolean): Promise<{ error?: string }> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') return { error: 'Not authorized' }

    // Cannot deactivate yourself
    if (userId === session.user.id) {
        return { error: 'You cannot deactivate your own account' }
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !currentlyActive },
    })

    await writeAuditLog({
        entity: 'User', entityId: userId, action: 'UPDATE',
        performedBy: session.user.id,
        oldValues: { isActive: currentlyActive },
        newValues: { isActive: user.isActive, name: user.name },
    })

    revalidatePath('/admin/users')
    return {}
}
