import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth(function middleware(req: NextRequest & { auth: unknown }) {
    const { pathname } = req.nextUrl
    const session = (req as unknown as { auth: { user?: { id: string } } | null }).auth

    // Allow login page through always
    if (pathname.startsWith('/login')) return NextResponse.next()

    // If not logged in, redirect to login
    if (!session?.user) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Protect all app routes except static files and API auth routes
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
}
