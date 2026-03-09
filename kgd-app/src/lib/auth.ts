import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: { strategy: 'jwt' },

    pages: {
        signIn: '/login',
    },

    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials)
                if (!parsed.success) return null

                const { email, password } = parsed.data

                const user = await prisma.user.findUnique({ where: { email } })
                if (!user || !user.isActive) return null

                const valid = await bcrypt.compare(password, user.passwordHash)
                if (!valid) return null

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            // Persist role into the JWT on first sign-in
            if (user) {
                token.id = user.id
                token.role = (user as { role: string }).role
            }
            return token
        },
        async session({ session, token }) {
            // Expose id and role on the session object
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
})
