---
name: prisma-best-practices
description: Prisma ORM best practices for PostgreSQL - schema design, queries, transactions, and performance optimization
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: database
  stack: prisma, postgresql
---

# Prisma Best Practices

## Schema Design

### Naming Conventions
- Use PascalCase for model names
- Use camelCase for field names
- Use singular model names (Customer, not Customers)
- Add `@@map()` for snake_case database tables

```prisma
model Customer {
  id        String   @id @default(cuid())
  firstName String
  lastName  String
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("customers")
}
```

### Decimal for Money
Always use Decimal for monetary values, never Float:

```prisma
model Invoice {
  totalAmount Decimal @db.Decimal(12, 2)
  paidAmount  Decimal @default(0) @db.Decimal(12, 2)
}
```

### Required vs Optional Fields
- Only use optional (?) when truly needed
- Provide defaults for non-critical fields
- Use enums for constrained values

```prisma
enum InvoiceStatus {
  UNPAID
  PARTIAL
  PAID
  CANCELLED
}

model Invoice {
  status InvoiceStatus @default(UNPAID)
  notes  String?       // optional only when needed
}
```

### Relationships
- Always add `onDelete` for required relations
- Use explicit relation fields when needed

```prisma
model Invoice {
  id         String  @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  @@index([customerId])
}
```

## Query Best Practices

### Select Only Needed Fields
```typescript
// ✅ CORRECT - explicit selection
const customers = await prisma.customer.findMany({
  select: {
    id: true,
    name: true,
    phone: true,
  },
})

// ❌ WRONG - returns all fields including sensitive ones
const customers = await prisma.customer.findMany()
```

### Pagination
```typescript
// Cursor-based pagination (better for large datasets)
const invoices = await prisma.invoice.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastId },
  orderBy: { createdAt: 'desc' },
})

// Offset-based (simpler, ok for small pages)
const customers = await prisma.customer.findMany({
  take: 20,
  skip: (page - 1) * 20,
})
```

### Include vs Select
```typescript
// Include related data when needed
const invoice = await prisma.invoice.findUnique({
  where: { id },
  include: {
    customer: { select: { name: true, phone: true } },
    items: true,
  },
})

// Use select when you don't need relations
const customerNames = await prisma.customer.findMany({
  select: { name: true },
})
```

## Transactions

### Single Transaction
```typescript
const result = await prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.create({
    data: { ... },
  })
  
  // Update customer balance
  await tx.customer.update({
    where: { id: customerId },
    data: { creditBalance: { decrement: invoice.totalAmount } },
  })
  
  return invoice
})
```

### Interactive Transactions
```typescript
import { Prisma } from '@prisma/client'

async function transferCredit(
  fromCustomerId: string,
  toCustomerId: string,
  amount: number
) {
  const result = await prisma.$transaction(
    async (tx) => {
      // Debit from source
      const source = await tx.customer.update({
        where: { id: fromCustomerId },
        data: { creditBalance: { decrement: amount } },
      })
      
      if (source.creditBalance < 0) {
        throw new Prisma.ContractValidationError('Insufficient credit')
      }
      
      // Credit to destination
      return tx.customer.update({
        where: { id: toCustomerId },
        data: { creditBalance: { increment: amount } },
      })
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
```

## Performance Optimization

### Indexing
```prisma
model Invoice {
  // Composite index for common query pattern
  @@index([customerId, invoiceDate])
  
  // Index for status filtering
  @@index([status])
  
  // Index for date range queries
  @@index([invoiceDate])
}
```

### Avoiding N+1 Queries
```typescript
// ❌ N+1 problem
const customers = await prisma.customer.findMany()
for (const customer of customers) {
  customer.invoices = await prisma.invoice.findMany({
    where: { customerId: customer.id }
  })
}

// ✅ Single query with include
const customers = await prisma.customer.findMany({
  include: {
    invoices: {
      where: { status: 'UNPAID' },
      orderBy: { invoiceDate: 'desc' },
    },
  },
})
```

### Batch Operations
```typescript
// ✅ Batch create
await prisma.invoiceItem.createMany({
  data: items.map(item => ({
    invoiceId,
    productId: item.productId,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.quantity * item.rate,
  })),
})

// ❌ Slow - individual creates
for (const item of items) {
  await prisma.invoiceItem.create({ data: { invoiceId, ...item } })
}
```

## Error Handling

### Prisma Errors
```typescript
import { Prisma } from '@prisma/client'

try {
  await prisma.customer.delete({ where: { id } })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint
        return { error: 'Customer already exists' }
      case 'P2025': // Record not found
        return { error: 'Customer not found' }
      default:
        throw error
    }
  }
}
```

### Not Found Patterns
```typescript
// Return null for optional lookups
const customer = await prisma.customer.findUnique({ where: { id } })
if (!customer) return null

// Throw for required lookups
const customer = await prisma.customer.findUniqueOrThrow({ where: { id } })
```

## Migrations

### Safe Migrations
```bash
# Create migration
npx prisma migrate dev --name add_customer_phone

# Apply in production
npx prisma migrate deploy

# Reset (development only!)
npx prisma migrate reset
```

### Data Migration
```typescript
// prisma/seed.ts - use for data migrations
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Update existing records
  await prisma.customer.updateMany({
    where: { phone: { contains: '-' } },
    data: { phone: (phone) => phone.replace(/-/g, '') },
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## Prisma Client Singleton

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## Common Patterns

### Balance Calculations
```typescript
// Calculate outstanding balance
const customer = await prisma.customer.findUnique({
  where: { id },
  include: {
    invoices: { select: { totalAmount: true, paidAmount: true } },
    payments: { select: { amount: true } },
  },
})

const totalInvoiced = customer.invoices
  .filter(i => i.status !== 'CANCELLED')
  .reduce((sum, i) => sum + Number(i.totalAmount), 0)

const totalPaid = customer.payments.reduce((sum, p) => sum + Number(p.amount), 0)
const outstanding = totalInvoiced - totalPaid
```

### Audit Logging
```typescript
async function logAction(
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction'>,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  entityId: string,
  oldValues: object | null,
  newValues: object | null,
  userId: string
) {
  await tx.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      oldValues,
      newValues,
      performedBy: userId,
    },
  })
}
```
