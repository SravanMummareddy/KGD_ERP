# KGD Account Tracking — Implementation Plan

## Background

Full codebase reviewed. The app is a Next.js 14+ (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL application using **server actions** for all mutations. Auth is cookie-session based. Data is fetched server-side on each page render (no client-side SWR/query cache). `revalidatePath` is used to bust Next.js route cache after mutations.

---

## User Review Required

> [!IMPORTANT]
> **Schema migrations required for Sections 2, 5, and 6.** Three new columns and one new table will be added to the database. A Prisma migration will be generated and run. All changes are **additive** — no existing columns are dropped or renamed. Backward compatibility is maintained.

> [!WARNING]
> **Payment Editing (Section 4)** reverses invoice allocations and recalculates balances. This is the highest-risk change because it modifies financial data. All balance updates are wrapped in a single Prisma transaction to prevent partial writes.

---

## Codebase Findings

### Bug 1 — Customer Edit Not Working
**Root cause:** The edit page at `/customers/[id]/edit/page.tsx` uses the correct `updateCustomer.bind(null, customer.id)` pattern and the server action calls `revalidatePath` + `redirect`. **However**, the form field is still labeled `Customer Name` instead of splitting into Business Name / Contact Person per Section 2. The form functionally works in isolation, but needs to be tested end-to-end.

**Additional finding:** The `CustomerContact` model has `name`, `phone`, `role` fields that are separate from the [Customer](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/customers/page.tsx#8-104) model. The `CustomerSchema` in [actions/customers.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/customers.ts) does **not** include `phone` at the top-level customer — contacts are added separately on the detail page. The form works but is confusing.

### Bug 2 — Cross-Tab Data Sync
**Root cause:** All pages are server-rendered and use `revalidatePath`. The issue is that `revalidatePath` in the customer update only calls:
```
revalidatePath(`/customers/${customerId}`)
revalidatePath('/customers')
```
But does not revalidate `/invoices`, `/payments`, `/dashboard`. This means if you're already on the invoices list page, it won't show the updated customer name until a full reload.

### Bug 3 — Invoice Print Button
**Status:** The print page at `/invoices/[id]/print/page.tsx` **exists and is complete**. The `<Link href="/invoices/${id}/print" target="_blank">` is also correct. The page auto-calls `window.print()` on load. This likely **works in production** but may fail if:
- The `/print` route is inside the [(app)](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/audit/page.tsx#17-18) layout group, which likely includes the sidebar/nav — causing the print preview to show nav chrome.
- The `window.onload` script may be blocked by Next.js hydration in some configs.

**Fix:** Move the print page **outside** the [(app)](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/audit/page.tsx#17-18) layout group so it renders with no nav bars. Also add a proper `<PrintButton />` client component that calls `window.print()` as a backup.

### Bug 4 — Cancel Button Confusion
**Finding:** The invoice detail page has:
1. A "Cancel" `<Link>` (navigates to customer) — actually this is "Back" behavior.
2. A `<form action={cancelInvoice}>` button labeled "Cancel" — this cancels the invoice but has **no confirmation modal**.

**Bigger issue:** [cancelInvoice](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/invoices.ts#119-147) in [actions/invoices.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/invoices.ts) sets `status = CANCELLED` but does **not** reverse `paidAmount`/`balanceDue` on the invoice or undo allocations. The customer's ledger will show wrong balances.

---

## Proposed Changes

### SECTION 1 — Bug Fixes

#### Bug 1: Customer Edit
The form works but needs testing. The fix is already in place — we will add robust revalidation (see Bug 2) and improve the form fields per Section 2.

#### Bug 2: Cross-Tab Data Sync

**[MODIFY] [customers.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/customers.ts)**
- Add `revalidatePath('/invoices')`, `revalidatePath('/payments')`, `revalidatePath('/dashboard')` to [updateCustomer](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/customers.ts#69-109)

**[MODIFY] [invoices.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/invoices.ts)**
- Add `revalidatePath('/dashboard')`, `revalidatePath('/customers')` to create/cancel

**[MODIFY] [payments.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/payments.ts)**
- Add `revalidatePath('/dashboard')` to payment recording

#### Bug 3: Invoice Print Button

**[MODIFY] invoice print page — move outside (app) layout**

The print page currently lives inside `src/app/(app)/invoices/[id]/print/page.tsx`. It inherits the app layout (sidebar, nav). We need to move it to `src/app/print/invoices/[id]/page.tsx` (outside the [(app)](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/audit/page.tsx#17-18) group) so it renders cleanly.

Update the Link in `invoices/[id]/page.tsx` to point to `/print/invoices/${invoice.id}`.

Add a `<PrintButton />` client component (`'use client'`) that calls `window.print()` on click, as a fallback for if user navigates directly to the page.

**[NEW] [PrintButton.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/components/invoices/PrintButton.tsx)**

#### Bug 4: Cancel Button Clarity + Balance Reversal

**[MODIFY] [invoices/[id]/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/invoices/%5Bid%5D/page.tsx)**
- Rename the "Cancel" action button to **"Cancel Invoice"**
- Add a confirmation modal (client component) before submitting the cancel form
- The "Back" behavior is already a `<Link>` to `/invoices`

**[MODIFY] [invoices.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/invoices.ts)**
- Update [cancelInvoice](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/invoices.ts#119-147) to:
  1. Delete all `PaymentAllocation` records for the invoice
  2. Recalculate unallocated payment totals per invoice
  3. Reset `paidAmount = 0`, `balanceDue = totalAmount`, `status = CANCELLED` on the invoice
  4. Log audit entry with `action: 'CANCEL'`
  5. Wrap in `prisma.$transaction`

---

### SECTION 2 — Customer Form Improvements

**Schema change required:** Add `phone` and `secondaryPhone` to the [Customer](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/customers/page.tsx#8-104) model directly (in addition to existing `CustomerContact` sub-table). This allows a simple one-step customer create/edit without needing to navigate to contacts separately.

**[MODIFY] [schema.prisma](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/prisma/schema.prisma)**
```diff
 model Customer {
   id              String    @id @default(cuid())
-  name            String
+  name            String    // kept for backward compat (contact person)
+  businessName    String?   // promoted to primary — required in new forms
+  phone           String?   // new: primary phone directly on customer
+  secondaryPhone  String?   // new: secondary phone
   ...
```

**[MODIFY] [customers.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/customers.ts)**
- Add `phone` and `secondaryPhone` to `CustomerSchema` and create/update handlers

**[MODIFY] [customers/new/page.tsx & customers/[id]/edit/page.tsx]**
- Rename form fields to: Business Name, Contact Person (mapped to `name`), Phone Number, Secondary Phone, Address, Notes
- Remove "Customer Name" label, replace with "Contact Person"
- Remove "Business / Shop Name" redundancy (now "Business Name" is primary)

---

### SECTION 3 — Unsaved Changes Guard (Back Button)

**Approach:** Create a reusable `<UnsavedChangesGuard />` client component that:
- Tracks form dirty state via `onChange` on the `<form>` element
- Intercepts `beforeunload` browser event
- Uses Next.js `router.beforePopState` (App Router uses `usePathname`/`useRouter` hook approach)
- Shows a native or custom modal: "You have unsaved changes. Discard?"

Since these are server-rendered forms that use server actions, the guard will be a **client wrapper** around the form.

**[NEW] [UnsavedChangesGuard.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/components/layout/UnsavedChangesGuard.tsx)**

Apply to:
- `customers/[id]/edit/page.tsx`
- `customers/new/page.tsx`
- `invoices/new/page.tsx` (already a client component)
- `products/new/page.tsx`
- `payments/new/page.tsx`

---

### SECTION 4 — Payment Editing

**New routes:**
- `GET /payments/[id]/edit` — payment edit page
- Server action: `updatePayment(paymentId, formData)` in [actions/payments.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/payments.ts)

**[NEW] [payments/[id]/edit/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/payments/%5Bid%5D/edit/page.tsx)**
- Shows existing payment values pre-filled
- Dropdown for edit reason: Correction / Duplicate Entry / Customer Adjustment / Refund / Other (with text input)
- Submit calls `updatePayment`

**[MODIFY] [payments.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/payments.ts)**
- Add `updatePayment(paymentId, formData)`:
  1. Capture old payment values
  2. Delete existing `PaymentAllocation` records
  3. Reverse `paidAmount`/`balanceDue`/`status` on affected invoices
  4. Update payment amount, date, method, reference, notes
  5. Re-run allocation logic against open invoices
  6. Write audit log with `oldValues`, `newValues`, `reason`, `editedBy`, timestamp
  7. Wrap in transaction

**[MODIFY] [payments/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/payments/page.tsx)**
- Add "Edit" link in actions column per row

---

### SECTION 5 — Cash Advances

**Schema change:** Add `creditBalance` field to [Customer](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/customers/page.tsx#8-104) to track unallocated advance payments.

**[MODIFY] [schema.prisma](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/prisma/schema.prisma)**
```diff
 model Customer {
+  creditBalance   Decimal  @default(0) @db.Decimal(12, 2)  // advance credit
```

**[MODIFY] [payments.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/payments.ts)**
- In [recordPayment](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/payments.ts#9-104): after allocating to open invoices, if `remaining > 0`, add remainder to `customer.creditBalance`
- In invoice creation: if customer has `creditBalance > 0`, allow applying it

**[MODIFY] [invoices/new/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/invoices/new/page.tsx)**
- If customer has credit balance, show "Apply advance credit: ₹X" checkbox

**[MODIFY] [customers/[id]/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/customers/%5Bid%5D/page.tsx)**
- Show "Advance Credit" as 4th stat card when `creditBalance > 0`
- Ledger shows "Advance Received" and "Applied to Invoice" rows

---

### SECTION 6 — Product Creation Dropdowns

**No schema change.** The [Product](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/actions/products.ts#62-98) model already has `sizeInches`, `gsm`, `color` fields.

**[MODIFY] [products/new/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/products/new/page.tsx)**

Convert size, color, GSM inputs to `<select>` with preset options + "Custom..." option. When "Custom" is selected, show a plain text/number input below it.

**[NEW] [SelectOrCustom.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/components/invoices/SelectOrCustom.tsx)**
- Generic reusable client component: `<SelectOrCustom name="..." options={[...]} />`

---

### SECTION 7 — Date Range Filters

**Approach:** Use URL search params (`?from=&to=&range=`) for all filter pages so they remain server-rendered with no client-side state complexity.

**[NEW] [DateRangeFilter.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/components/layout/DateRangeFilter.tsx)**
- Client component: renders a filter bar with "Today / Last 7 Days / Last 30 Days / Custom Range" buttons
- On select, pushes to router with `?range=7` or `?from=2024-01-01&to=2024-01-31`

Apply to (server pages read `searchParams`):
- [invoices/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/invoices/page.tsx)
- [payments/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/payments/page.tsx)
- [audit/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/audit/page.tsx)
- `customers/[id]/page.tsx` (ledger)

---

### SECTION 8 — Audit Log Improvements

**[MODIFY] [audit/page.tsx](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/app/%28app%29/audit/page.tsx)**
- Accept `searchParams` for: `entity`, `action`, `from`, [to](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/src/lib/utils.ts#48-55), `search`
- Build dynamic `prisma.auditLog.findMany` `where` clause from params
- Add filter bar at top (reuse `DateRangeFilter`)
- Add `action` filter: Create / Update / Delete / Cancel
- Add entity type filter dropdown
- Add `CANCEL` to `actionBadge` map

---

### SECTION 9 — General UX Polish

**Loading states:** Pages using server actions already show a pending state via Next.js `useFormStatus`. Add `<button disabled={pending}>` to all forms using the `useFormStatus()` hook.

**Missing error handling:** Wrap server action calls in try/catch and use `useActionState` to surface errors to the user.

**Inconsistent labels:**
- Invoice list Cancel column button → "Cancel Invoice"  
- Invoice detail nav → add explicit "← Back to Invoices" link

**Missing navigation:** Payment list page has no "View" link per row. Add link to customer detail.

---

## Schema Migration Summary

Three additive changes to [schema.prisma](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/prisma/schema.prisma):

```diff
model Customer {
+  phone           String?
+  secondaryPhone  String?
+  creditBalance   Decimal  @default(0) @db.Decimal(12, 2)
```

Migration command (run after schema edit):
```bash
npx prisma migrate dev --name add_customer_phone_credit
```

---

## Verification Plan

### Automated Tests
No existing unit or integration tests found (only a Playwright placeholder at [tests/example.spec.ts](file:///c:/Users/smummare/OneDrive%20-%20Arizona%20State%20University/From%20Lumin%20-%20sort%20them/Documents/projects/KGD_ACCOUNT_TRACKING/kgd-app/tests/example.spec.ts)). We will not add new automated tests for this PR to avoid scope creep, but will do thorough manual verification.

### Manual Verification Steps

**Bug 1 — Customer Edit:**
1. Go to `/customers`, click "View" on any customer
2. Click "Edit" — should open pre-filled edit form
3. Change "Contact Person" and "Phone Number", click "Save Changes"
4. Verify: customer list, customer detail, invoice list all show updated name

**Bug 2 — Cross-Tab Data Sync:**
1. Open `/invoices` list in one tab, open `/customers/[id]` in another
2. Edit customer name from the customers tab
3. Reload the invoices tab — customer name should be updated

**Bug 3 — Print Button:**
1. Open any invoice at `/invoices/[id]`
2. Click "🖨 Print" — a new tab should open at `/print/invoices/[id]`
3. The browser print dialog should appear automatically
4. Verify: no sidebar/nav visible in the print preview

**Bug 4 — Cancel Invoice:**
1. Open an invoice with a recorded payment (PARTIAL status)
2. Click "Cancel Invoice" — a confirmation modal should appear
3. Confirm — invoice should be marked CANCELLED
4. Go to customer ledger — outstanding balance should NOT include that invoice amount
5. Go to audit log — should show CANCEL action

**Section 4 — Payment Edit:**
1. Go to `/payments`, click "Edit" on any payment
2. Change amount and select reason "Correction"
3. Save — verify invoice balances are recalculated
4. Verify audit log shows old/new values and reason

**Section 5 — Cash Advance:**
1. Record a payment for a customer with no open invoices
2. Customer credit balance should show on their detail page
3. Create a new invoice for that customer — "Apply advance credit" checkbox appears
4. Verify ledger shows advance applied

**Section 6 — Product Dropdowns:**
1. Go to `/products/new`
2. Size dropdown shows 6, 8, 10, 12, 14, Custom
3. Select "Custom" — a text input appears
4. Verify product saves correctly with custom value

**Section 7 — Date Filters:**
1. Go to `/invoices`
2. Click "Last 7 Days" — list filters correctly
3. Click "Custom Range" — enter dates — list filters correctly
4. Verify URL has `?range=7` or `?from=&to=` params

**Section 8 — Audit Log Filters:**
1. Go to `/audit`
2. Filter by Entity = "Invoice" — only invoice entries shown
3. Filter by Action = "CANCEL" — only cancel entries shown
4. Search for a customer name — relevant entries appear
