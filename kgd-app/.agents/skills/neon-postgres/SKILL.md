---
name: neon-postgres
description: Neon Serverless Postgres best practices for Next.js + Prisma applications. Connection pooling, branching, and common patterns.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: database
  stack: neon, postgresql
---

# Neon Serverless Postgres

Neon is a serverless Postgres platform with compute/storage separation, autoscaling, and scale-to-zero.

## Connection String

```bash
# Standard connection
DATABASE_URL="postgresql://user:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neondb"

# With connection pooling (recommended for serverless)
DATABASE_URL="postgresql://user:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
```

## Connection Pooling

Neon uses PgBouncer for connection pooling. Enable it for serverless:

```bash
# Add ?sslmode=require&pgbouncer=true to connection string
DATABASE_URL="postgresql://user:pass@host/neondb?sslmode=require&pgbouncer=true"
```

### When to Use Pooling
| Environment | Pooling |
|------------|---------|
| Vercel/Serverless | Required |
| Next.js Node.js | Optional |
| Long-running processes | Not needed |

## Prisma with Neon

### schema.prisma
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### Prisma Client Setup
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## Branching for Development

### Create a Branch
```bash
# Using Neon CLI
neonctl branches create --name feature-branch

# Get connection string
neonctl connection-string --branch feature-branch
```

### Use in Development
```bash
# .env.local
DATABASE_URL="postgresql://user:pass@ep-feature-branch-123456.us-east-2.aws.neon.tech/neondb"
```

### Workflow
1. Create branch for new feature
2. Run migrations: `npx prisma migrate dev`
3. Test changes
4. Merge to main
5. Delete branch

## Common Issues

### Connection Timeouts
```typescript
// Increase timeout in Prisma
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  __internal: {
    maxWait: 5000, // 5 seconds
  },
})
```

### Scale to Zero
Neon scales to zero after 5 minutes idle. First request may be slow (cold start ~500ms).

**Solution**: Keep-alive pings or use connection pooler with persistent connections.

### SSL Requirements
Neon requires SSL connections:
```bash
# Add to connection string
?sslmode=require
```

## CLI Commands

```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth

# List branches
neonctl branches list

# Create branch
neonctl branches create --name my-branch

# Get connection string
neonctl connection-string

# Check status
neonctl status
```

## Best Practices

1. **Always use SSL** - `sslmode=require` in connection string
2. **Use pooling for serverless** - Prevents connection exhaustion
3. **Branch for features** - Isolated environment for each feature
4. **Monitor usage** - Neon dashboard shows connection counts
5. **Set connection limits** - Don't exceed your plan's limits

## Useful Links

- Docs: https://neon.tech/docs
- Connection String: https://neon.tech/docs/connect/connection-string
- Branching: https://neon.tech/docs/introduction/branching
- Connection Pooling: https://neon.tech/docs/connect/connection-pooling
