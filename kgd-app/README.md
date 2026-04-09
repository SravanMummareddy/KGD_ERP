# KGD Account Tracking

Paper plate factory management system — digitizes customer records, invoicing, payments, and inventory tracking for a manufacturing business.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Custom CSS design system + Tailwind CSS 4
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL (Neon Serverless), Prisma 6
- **Auth**: next-auth v5 (cookie-session)
- **Testing**: Playwright (e2e)

## Getting Started

```bash
# Install dependencies
npm install

# Configure DATABASE_URL and AUTH_SECRET in .env (see .env.example)

# Run database migrations
npx prisma migrate dev --name init

# Seed sample data (optional)
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx prisma migrate dev --name <name>` | Create and apply migration |
| `npx prisma studio` | Open Prisma database browser |
| `npm run db:seed` | Seed sample data |
| `npm run test:e2e` | Run Playwright tests |
| `npm run test:e2e:ui` | Playwright tests in UI mode |

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected routes (with sidebar)
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── inventory/
│   │   ├── admin/          # ADMIN ONLY: users, deleted items
│   │   └── audit/          # ADMIN ONLY: audit log
│   ├── login/              # Authentication
│   └── print/              # Print-friendly invoice pages
├── actions/                # Server Actions (mutations)
│   ├── customers.ts        # create, update, delete (soft), restore
│   ├── products.ts         # create, update, adjustStock, delete (soft), restore
│   ├── invoices.ts         # create, cancel
│   ├── payments.ts         # record, update
│   ├── inventory.ts        # addItem, addTransaction, delete (soft), restore
│   └── users.ts            # createUser, updateUser, toggleActive (ADMIN)
├── components/
│   ├── layout/             # Sidebar, filters
│   └── ui/                 # Pagination, Toast, ConfirmModal
└── lib/                    # Utilities (auth, prisma, audit)
```

## Key Patterns

- **Server Actions**: All mutations in `src/actions/` — always call `auth()`, always `logAudit()`, always `revalidatePath()`
- **Server Rendering**: No client-side caching — use `revalidatePath()` after mutations
- **Validation**: Zod for server-side form validation
- **Audit**: All data changes logged to AuditLog with before/after snapshots
- **Soft Delete**: Customers, Products, and InventoryItems use soft delete (`isActive=false`, `deletedAt`, `deletedById`) — never hard deleted
- **Recycle Bin**: Admin-only `/admin/deleted` to view and restore soft-deleted records
- **Toasts**: All user feedback via toast system — never `alert()`

## Role-Based Access

| Feature | STAFF | ADMIN |
|---------|-------|-------|
| Dashboard, Customers, Invoices, Payments, Products, Inventory | ✅ | ✅ |
| Audit Log | ❌ | ✅ |
| User Management | ❌ | ✅ |
| Recycle Bin / Restore | ❌ | ✅ |
| Permanent Delete | ❌ | ✅ |

## Database

Schema defined in `prisma/schema.prisma`. Key models:

| Model | Purpose |
|-------|---------|
| User | System users (ADMIN/STAFF, active/inactive) |
| Customer | Business customers with soft-delete support |
| CustomerContact | Multiple contacts per customer |
| Product | Finished goods (Plates/Sheets) with stock tracking |
| Invoice | Sales documents (never deleted, only cancelled) |
| InvoiceItem | Line items |
| Payment | Customer payments (never deleted) |
| PaymentAllocation | Split payment mapping |
| InventoryItem | Raw materials with soft-delete support |
| InventoryTransaction | Stock movement history |
| AuditLog | Full change history |

## Soft Delete Rules

- **Customer**: Cannot delete if outstanding invoices (unpaid balance > 0)
- **Product**: Cannot delete if appears in unpaid invoice line items
- **InventoryItem**: Can always be soft-deleted (history preserved)
- **Invoice**: Never deleted — CANCELLED status used instead
- **Payment**: Never deleted — corrected via edit flow

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | next-auth session secret (`openssl rand -hex 32`) |
