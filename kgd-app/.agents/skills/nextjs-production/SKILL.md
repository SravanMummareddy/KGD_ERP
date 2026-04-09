---
name: nextjs-production
description: Next.js 16 production deployment checklist and best practices for App Router applications
license: MIT
compatibility: opencode
metadata:
  audience: developers
  stack: nextjs
---

# Next.js 16 Production Best Practices

## Performance

### Server Components & Data Fetching
- Use Server Components by default; only add 'use client' when needed
- Fetch data in Server Components, not client-side
- Use `revalidatePath()` or `revalidateTag()` for cache invalidation
- Avoid `useEffect` for initial data fetching

### Bundle Optimization
```typescript
// next.config.ts - optimize package imports
const nextConfig = {
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
}
```

### Image Optimization
- Always use `<Image>` component from `next/image`
- Specify `width`, `height`, and `alt` props
- Use `priority` for above-the-fold images
- Use WebP/AVIF formats via `formats` config

## SEO

### Metadata API
```typescript
// app/layout.tsx or app/[page]/page.tsx
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: {
    title: 'OG Title',
    images: ['/og-image.jpg'],
  },
}
```

### Sitemap & Robots
- Generate sitemap via `app/sitemap.ts` or `next-sitemap`
- Add `robots.txt` via `app/robots.ts`

## Error Handling

### Error Boundaries
```typescript
// app/error.tsx
'use client'
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Not Found
```typescript
// app/not-found.tsx
export default function NotFound() {
  return <div>Page not found</div>
}
```

## Build & Deployment

### Environment Variables
```bash
# .env.local (local) / .env.production (production)
# Server-only (never prefix with NEXT_PUBLIC_)
DATABASE_URL=postgres://...
AUTH_SECRET=...

# Client-safe (prefix with NEXT_PUBLIC_)
NEXT_PUBLIC_APP_URL=https://example.com
```

### Build Commands
```bash
npm run build    # Production build
npm run start    # Start production server
```

### TypeScript Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Monitoring

### Logging
- Use structured logging (console.log with JSON in production)
- Log errors with stack traces
- Use Next.js built-in error reporting or Sentry

### Health Checks
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

## Checklist Before Production

- [ ] Run `npm run build` without errors
- [ ] Test all pages on localhost:3000
- [ ] Verify environment variables are set correctly
- [ ] Enable security headers in next.config.ts
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS if needed
- [ ] Test error boundaries
- [ ] Check all images have alt text
- [ ] Verify sitemap and robots.txt
- [ ] Set up error monitoring (Sentry, etc.)
