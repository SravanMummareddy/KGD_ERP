# KGD Account Tracking - Project Documentation

## Project Overview

**Project Name:** KGD Account Tracking
**Project Type:** Full-stack web application (Next.js + PostgreSQL)
**Purpose:** Paper plate factory management system — digitizes customer records, invoicing, payments, and inventory tracking for a manufacturing business in Vijayawada.
**Owner:** Sravan

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js Server Actions |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Prisma 6 |
| Authentication | next-auth v5 (cookie-session) |
| Styling | Custom CSS design system (globals.css) + Tailwind CSS 4 |
| Testing | Playwright (e2e tests) |

---

## Project Structure

```
kgd-app/
├── prisma/
│   ├── schema.prisma       # Database schema (single source of truth)
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Database seeder
├── src/
│   ├── app/
│   │   ├── (app)/          # Protected routes (with sidebar)
│   │   │   ├── dashboard/
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx          # List with search + filter
│   │   │   │   ├── new/page.tsx      # Create form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Customer detail
│   │   │   │       └── edit/page.tsx # Edit form
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── edit/page.tsx
│   │   │   │       └── history/page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── payments/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── admin/                # ADMIN ONLY
│   │   │   │   ├── page.tsx          # Admin dashboard
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx      # User list (active/inactive filter)
│   │   │   │   │   ├── new/page.tsx  # Create user
│   │   │   │   │   └── [id]/edit/page.tsx
│   │   │   │   └── deleted/
│   │   │   │       └── page.tsx      # Recycle bin (customers/products/inventory)
│   │   │   └── audit/
│   │   ├── login/            # Authentication
│   │   ├── print/            # Print-friendly invoice pages
│   │   ├── layout.tsx
│   │   └── page.tsx          # Redirects to /login or /dashboard
│   ├── actions/              # Server Actions (mutations)
│   │   ├── customers.ts      # create, update, delete (soft), restore
│   │   ├── products.ts       # create, update, adjustStock, delete (soft), restore
│   │   ├── invoices.ts       # create, cancel
│   │   ├── payments.ts       # record, update
│   │   ├── inventory.ts      # addItem, addTransaction, delete (soft), restore
│   │   └── users.ts          # createUser, updateUser, toggleActive (ADMIN only)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ColumnFilter.tsx
│   │   │   ├── DateDropdownFilter.tsx
│   │   │   └── DateRangeFilter.tsx
│   │   ├── ui/
│   │   │   ├── Pagination.tsx
│   │   │   ├── Toast.tsx             # Toast notification system
│   │   │   ├── ToastProvider.tsx     # Context + auto-dismiss
│   │   │   └── ConfirmModal.tsx      # Reusable confirm dialog
│   │   ├── invoices/
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── AdjustStockModal.tsx
│   │   │   ├── CancelInvoiceButton.tsx
│   │   │   └── SelectOrCustom.tsx
│   │   └── inventory/
│   │       ├── AddNewItemForm.tsx
│   │       └── RecordMovementForm.tsx
│   ├── lib/
│   │   ├── auth.ts           # next-auth configuration
│   │   ├── prisma.ts         # Database client
│   │   ├── audit.ts          # Audit logging utility
│   │   └── outstanding.ts    # Balance calculation
│   └── middleware.ts         # Route protection
├── e2e/                      # Playwright tests
├── package.json
└── playwright.config.ts
```

---

## Database Schema

### Core Models

1. **User** — System users with ADMIN/STAFF roles; `isActive` for account enable/disable
2. **Customer** — Business customers; soft-delete via `isActive`, `deletedAt`, `deletedById`
3. **CustomerContact** — Multiple contacts per customer (cascade deletes)
4. **Product** — Plates and sheets; soft-delete via `isActive`, `deletedAt`, `deletedById`
5. **Invoice** — Sales invoices; CANCELLED status instead of delete (financial integrity)
6. **InvoiceItem** — Line items (cascade deletes with invoice)
7. **Payment** — Customer payments; never deleted, only reconciled
8. **PaymentAllocation** — Maps payments to invoices (split payment support)
9. **InventoryItem** — Raw materials; soft-delete via `isActive`, `deletedAt`, `deletedById`
10. **InventoryTransaction** — Stock movements (never deleted)
11. **AuditLog** — Full change history with before/after snapshots

### Soft Delete Fields (Customer, Product, InventoryItem)

```prisma
isActive    Boolean   @default(true)
deletedAt   DateTime?               // set on soft delete, null when active
deletedById String?                 // userId who performed the delete
```

- `isActive = false` + `deletedAt` set = soft deleted
- Restore = set `isActive = true`, clear `deletedAt` and `deletedById`
- All list queries MUST filter `where: { isActive: true }` unless in the recycle bin view

### Key Enums

```
Role           ADMIN | STAFF
ProductType    PLATE | SHEET
InvoiceStatus  UNPAID | PARTIAL | PAID | CANCELLED
PaymentMethod  CASH | UPI | BANK_TRANSFER | CHEQUE | OTHER
StockMoveType  PURCHASE | ADJUSTMENT | USAGE
```

---

## Feature Areas

### Implemented

- Multi-user authentication with role-based access (ADMIN / STAFF)
- Customer management with multiple contacts
- Invoice lifecycle (create → allocate payments → track outstanding)
- Split payment allocation across multiple invoices
- Advance credit balance tracking
- Finished goods inventory (Products) with stock packets/loose tracking
- Raw materials inventory with purchase/usage/adjustment movements
- Comprehensive audit log of all data changes
- Pagination with smart ellipsis on all list pages
- Date range and column filters on invoices, payments, audit log
- Admin-only audit log
- Print-ready invoice layout

### Planned / In Progress

#### 1. Soft Delete + Recycle Bin (Admin)
- Delete buttons on customers list, products page, inventory items
- Soft delete = set `isActive=false`, stamp `deletedAt`, `deletedById`, write audit log
- Admin only: `/admin/deleted` — tabbed view (Customers | Products | Inventory)
- Restore = one-click reinstate with audit trail
- Permanent delete = ADMIN only, separate confirm step, writes final audit entry
- Business rules: cannot soft-delete a customer with outstanding invoices (unpaid balance > 0)

#### 2. User Management (Admin Only)
- `/admin/users` — paginated list with active/inactive filter badge
- Create user: name, email, role, initial password (hashed via bcryptjs)
- Edit user: name, email, role — cannot change own role
- Toggle active/inactive: one-click with confirmation (cannot deactivate yourself)
- Deactivated users cannot log in (middleware checks `isActive`)
- All user actions logged to AuditLog under entity `User`

#### 3. Search
- URL-param based, server-side — no client state needed
- Customers: `?q=` searches `name`, `businessName`, `phone`
- Invoices: `?q=` searches `invoiceNumber`, customer `name`/`businessName`
- Products: `?q=` searches `name`
- Payments: `?q=` searches customer name, `reference`
- Search input uses `<form method="GET">` with debounce handled client-side

#### 4. Toast Notifications
- Replace all `alert()` calls with toast system
- `<ToastProvider>` wraps app layout, exposes `useToast()` hook
- Types: `success` (green), `error` (red), `info` (blue), `warning` (amber)
- Auto-dismiss after 4 seconds, manual dismiss via X button
- Accessible: role="alert" for errors

#### 5. Confirm Delete Modal (Reusable)
- `<ConfirmModal>` component: title, body text, danger button label
- Used for all delete actions
- Shows financial impact warning if customer has outstanding balance
- Server action errors surface back as toast messages

---

## Key Patterns

### Server Actions

All mutations use **Server Actions** in `src/actions/`. Pattern:

```typescript
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

export async function deleteCustomer(customerId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const old = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })

  // Business rule: block delete if outstanding balance
  if (Number(old.creditBalance) < 0) {
    throw new Error('Cannot delete customer with outstanding balance')
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: false, deletedAt: new Date(), deletedById: session.user.id },
  })

  await logAudit({ entity: 'Customer', entityId: customerId, action: 'DELETE', oldValues: old, userId: session.user.id })
  revalidatePath('/customers')
}
```

### Data Fetching

Pages are **Server Components** — fetch data directly:

```typescript
export default async function CustomersPage({ searchParams }) {
  const sp = await searchParams
  const q = sp.q ?? ''

  const customers = await prisma.customer.findMany({
    where: {
      isActive: true,
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { businessName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ]
      } : {})
    }
  })
}
```

### Authentication & Authorization

- `src/middleware.ts` — protects all `/(app)/` routes, checks session cookie
- `auth()` called in every Server Action to get current user
- Admin routes check `session.user.role === 'ADMIN'`, redirect non-admins to `/dashboard`
- Deactivated users: NextAuth signIn callback rejects users where `isActive === false`

### Audit Trail

All mutations log to `AuditLog` via `src/lib/audit.ts`:

```typescript
await logAudit({
  entity: 'Customer',     // model name
  entityId: id,
  action: 'DELETE',       // CREATE | UPDATE | DELETE | RESTORE | CANCEL
  oldValues: beforeData,  // snapshot before change
  newValues: afterData,   // snapshot after change (null for deletes)
  userId: session.user.id,
})
```

Action values used:
- `CREATE` — new record created
- `UPDATE` — record fields changed
- `DELETE` — soft deleted (isActive = false)
- `RESTORE` — reinstated from recycle bin
- `CANCEL` — invoice cancelled (financial void)

---

## Business Rules

### Financial Integrity
- **Invoices** are NEVER hard-deleted — only CANCELLED. Cancelled invoices remain visible with strikethrough.
- **Payments** are NEVER deleted — only corrected via update. Historical payment records are immutable after 24h.
- **PaymentAllocations** cascade-delete only when their parent Payment is corrected in the edit flow.

### Soft Delete Rules
- **Customer**: cannot soft-delete if any UNPAID or PARTIAL invoices exist (balance > 0)
- **Product**: cannot soft-delete if it appears in any UNPAID/PARTIAL invoice line item
- **InventoryItem**: can always be soft-deleted (transactions are historical records)

### User Rules
- Admin cannot deactivate themselves
- Deactivated users retain all their historical records (invoices, payments they created)
- Only ADMIN role can: access `/admin/*`, see deleted items, manage users, permanently delete

### Stock Rules
- `stockPieces` on Product tracks raw piece count (14 pieces = 1 packet for display only)
- Stock adjustments always recorded via `adjustStock()` — never direct DB update
- Raw material `currentStock` updated only through `addInventoryTransaction()`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma migrate dev --name <name>` | Create named migration |
| `npm run db:seed` | Seed database with sample data |
| `npm run test:e2e` | Run Playwright tests |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npx prisma studio` | Open database browser |

---

## Running the Application

### Prerequisites

1. Node.js 20+
2. PostgreSQL database (Neon or local)

### Setup

```bash
cd kgd-app
cp .env.example .env   # Configure DATABASE_URL and AUTH_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed        # Optional: seed sample data
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon or local) |
| `AUTH_SECRET` | next-auth session secret (generate with `openssl rand -hex 32`) |

---

## Adding a New Feature — Checklist

1. **Schema** — Edit `prisma/schema.prisma` if model changes needed
2. **Migration** — `npx prisma migrate dev --name feature_name`
3. **Server Action** — Create/update in `src/actions/`; always call `auth()` first; always call `logAudit()`; always call `revalidatePath()`
4. **Page** — Create in `src/app/(app)/`
5. **Component** — Create in `src/components/` if reusable across pages
6. **Sidebar** — Add nav item to `Sidebar.tsx` if it's a top-level route
7. **Test** — Add Playwright test in `e2e/`

---

## Important Notes for Agents

1. **No client-side state management** — Use Server Actions and server rendering; no SWR/React Query
2. **Always use Prisma** — Never write raw SQL
3. **Use Zod for validation** — All form data validated server-side before DB write
4. **Respect revalidatePath** — Call after every mutation to bust Next.js route cache
5. **Audit every mutation** — CREATE, UPDATE, DELETE, RESTORE, CANCEL must all be logged
6. **Decimal types** — Use `@db.Decimal(12, 2)` for money, `Decimal(12, 3)` for stock quantities — NEVER Float
7. **Date handling** — Store as `DateTime` in UTC, display in IST (Asia/Kolkata) using `formatDate`/`formatDateTime` from `src/lib/utils`
8. **Soft delete pattern** — Set `isActive=false`, stamp `deletedAt` and `deletedById`; never hard-delete customers/products/inventory
9. **Admin guard** — Every action or page under `/admin/` must verify `session.user.role === 'ADMIN'`
10. **SVG icons inline** — No external icon library; write inline SVG components (no lucide-react, no heroicons)
11. **CSS design system** — Use classes from `globals.css` (`.btn`, `.badge`, `.modal-*`, `.page-fade-in`, etc.); avoid ad-hoc inline styles
12. **No alert()** — Use toast system for all user-facing success/error feedback
13. **isActive filter** — ALL list queries must include `where: { isActive: true }` unless explicitly showing the recycle bin

---

## Dependencies

### Production

- `@prisma/client` — Database ORM
- `next` — React framework
- `next-auth` — Authentication
- `react` / `react-dom`
- `zod` — Schema validation
- `bcryptjs` — Password hashing

### Development

- `prisma` — Database tooling
- `@playwright/test` — E2E testing
- `typescript`
- `tailwindcss`
- `eslint`

---
# Skills

This repository includes reusable skill guides located in:

.agents/skills/

When performing tasks, check this directory for relevant guidance and follow the best practices defined in the skill documentation.

Available skills:

- **Neon Postgres**  
  Location: `.agents/skills/neon-postgres/SKILL.md`  
  Use for database connections, Neon serverless configuration, connection strings, and Postgres setup.

- **Prisma Best Practices**  
  Location: `.agents/skills/prisma-best-practices/SKILL.md`  
  Use for Prisma schema design, migrations, relations, query optimization, and database access patterns.

- **Next.js Production**  
  Location: `.agents/skills/nextjs-production/SKILL.md`  
  Use for production configuration, performance optimization, API routes, and deployment readiness.

- **Tailwind Best Practices**  
  Location: `.agents/skills/tailwind-best-practices/SKILL.md`  
  Use for styling patterns, responsive layouts, and maintainable Tailwind usage.

- **Frontend Design**  
  Location: `.agents/skills/frontend-design/SKILL.md`  
  Use for component structure, UI patterns, layout design, and accessibility considerations.

- **CSS Animations**  
  Location: `.agents/skills/css-animations/SKILL.md`  
  Use for animation patterns, transitions, and motion design in the UI.

- **Security Hardening**  
  Location: `.agents/skills/security-hardening/SKILL.md`  
  Use for authentication, API validation, environment variable handling, and production security practices.

Before implementing features or fixes, review relevant skills in `.agents/skills` and follow the documented patterns where applicable.

---------

## Contact

Project owner: Sravan
Business: Paper plate manufacturing in Vijayawada
