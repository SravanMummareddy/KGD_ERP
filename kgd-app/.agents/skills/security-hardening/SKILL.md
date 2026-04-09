---
name: security-hardening
description: Security hardening checklist for Next.js applications - headers, authentication, OWASP Top 10, and production best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
  stack: nextjs
---

# Next.js Security Hardening Checklist

## HTTP Security Headers

Add to `next.config.ts`:

```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()'
  },
]

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}
```

## Content Security Policy (CSP)

```typescript
// next.config.ts
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
`

const nextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
      ],
    }]
  },
}
```

## Environment Variables

### Rules
- **NEVER** prefix secrets with `NEXT_PUBLIC_`
- Only use `NEXT_PUBLIC_` for genuinely public values
- Keep server-only vars in `.env.local` or server-side only

```bash
# ✅ CORRECT - server only
DATABASE_URL=postgres://...
AUTH_SECRET=super-secret-key

# ❌ WRONG - exposes secret to client
NEXT_PUBLIC_SECRET=my-api-key
```

### Validation
Validate all environment variables at runtime:
```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
})

export const env = envSchema.parse(process.env)
```

## Input Validation with Zod

Validate ALL user input in Server Actions:

```typescript
import { z } from 'zod'

const CustomerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
})

export async function createCustomer(formData: FormData) {
  const result = CustomerSchema.safeParse(Object.fromEntries(formData))
  if (!result.success) {
    return { error: result.error.flatten() }
  }
  // proceed with validated data
}
```

## Authentication & Sessions

### Session Configuration
```typescript
// For next-auth v5
export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: '__Secure-authjs.session-token',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
}
```

### Middleware Protection
```typescript
// middleware.ts
import { authMiddleware } from '@auth'

export default authMiddleware({
  protectedRoutes: ['/dashboard', '/customers', '/invoices'],
  publicRoutes: ['/login', '/api/auth'],
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## Authorization

### Role-Based Access Control
```typescript
// lib/auth.ts
export async function requireRole(allowedRoles: string[]) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden')
  }
  return session.user
}

// Usage in Server Action
export async function deleteCustomer(customerId: string) {
  const user = await requireRole(['ADMIN'])
  // proceed with deletion
}
```

### Server-Side Authorization
```typescript
// Always validate ownership server-side
export async function getInvoice(id: string, userId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true },
  })
  
  if (!invoice) return null
  if (invoice.createdById !== userId && user.role !== 'ADMIN') {
    throw new Error('Access denied')
  }
  
  return invoice
}
```

## Database Security

### Prisma Best Practices
- Use parameterized queries (Prisma does this automatically)
- Select only needed fields
- Never expose raw database errors to client

```typescript
// ✅ CORRECT - explicit field selection
const customer = await prisma.customer.findUnique({
  where: { id },
  select: { id: true, name: true, phone: true },
})

// ❌ WRONG - exposes all fields including sensitive ones
const customer = await prisma.customer.findUnique({
  where: { id },
})
```

### SQL Injection Prevention
Prisma automatically prevents SQL injection. Never use template literals for queries:
```typescript
// ❌ DANGEROUS
await prisma.$queryRaw`SELECT * FROM users WHERE name = ${userInput}`

// ✅ SAFE - Prisma parameterized queries
await prisma.user.findMany({
  where: { name: userInput },
})
```

## Rate Limiting

Protect Server Actions and API routes:

```typescript
import { ratelimit } from '@/lib/ratelimit'

export async function createInvoice(formData: FormData) {
  const { success, remaining } = await ratelimit.limit(requestIp.get(req) || 'anonymous')
  
  if (!success) {
    return { error: 'Too many requests. Please try again later.' }
  }
  // proceed with action
}
```

## Security Checklist

### Pre-Production
- [ ] Security headers configured in next.config.ts
- [ ] CSP policy defined and tested
- [ ] All secrets server-only (no NEXT_PUBLIC_ prefix)
- [ ] Zod validation on all inputs
- [ ] Rate limiting on sensitive endpoints
- [ ] HTTP-only, secure, sameSite cookies
- [ ] Role-based access control implemented
- [ ] Authorization checks on all data access
- [ ] poweredByHeader: false
- [ ] Error messages don't leak stack traces

### OWASP Top 10 Coverage
| Risk | Mitigation |
|------|------------|
| A01 Broken Access Control | Server-side auth checks on every endpoint |
| A02 Cryptographic Failures | HTTPS only, secure session config |
| A03 Injection | Zod validation, Prisma parameterized queries |
| A04 Insecure Design | Threat modeling, rate limiting |
| A05 Security Misconfiguration | Security headers, CSP |
| A06 Vulnerable Components | npm audit, Dependabot |
| A07 Auth Failures | Secure session config, MFA ready |
| A08 Data Integrity | Audit logging, signed cookies |
| A09 Logging Failures | Structured logging, error tracking |
| A10 SSRF | Validate all external URLs |

### Testing Commands
```bash
# Dependency audit
npm audit --audit-level=high

# Security scan
npx snyk test

# Headers check
curl -I https://your-app.com
```
