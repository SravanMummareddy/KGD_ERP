import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    session: { strategy: 'jwt' },
    providers: [], // Add your providers in auth.ts so Prisma/bcrypt don't leak into edge middleware
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as { role: string }).role
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
} satisfies NextAuthConfig
