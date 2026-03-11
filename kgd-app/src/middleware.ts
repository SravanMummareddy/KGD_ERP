import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)
import type { NextRequest } from 'next/server'

export default auth(function middleware(req: NextRequest & { auth: unknown }) {
    const { pathname } = req.nextUrl
    const session = (req as unknown as { auth: { user?: { id: string } } | null }).auth

    // Allow login page through always
    if (pathname.startsWith('/login')) return NextResponse.next()

    // If not logged in, redirect to login
    if (!session?.user) {
        // In Vercel, req.url can sometimes unexpectedly retain a localhost or internal IP reference.
        // We explicitly derive the host from x-forwarded-host to be extremely safe.
        const host = req.headers.get('x-forwarded-host') || req.nextUrl.host
        const protocol = req.headers.get('x-forwarded-proto') || 'https'
        const baseUrl = host.includes('localhost') ? `http://${host}` : `${protocol}://${host}`
        
        return NextResponse.redirect(new URL('/login', baseUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Protect all app routes except static files and API auth routes
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
}
