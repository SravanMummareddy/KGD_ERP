# KGD Account Tracking — Task Checklist

## Section 1 — Bug Fixes
- [ ] S1.1: Add complete revalidatePath calls to customers.ts, invoices.ts, payments.ts (cross-tab sync)
- [ ] S1.2: Fix cancelInvoice to reverse paidAmount/balanceDue and add confirmation modal
- [ ] S1.3: Move print page outside (app) layout group; add PrintButton client component
- [ ] S1.4: Rename "Cancel" → "Cancel Invoice" with confirmation modal on invoice detail

## Section 2 — Customer Form Improvements
- [ ] S2.1: Add phone, secondaryPhone to Customer schema + migration
- [ ] S2.2: Update CustomerSchema and customers.ts actions to include phone/secondaryPhone
- [ ] S2.3: Update customer new/edit pages with new field labels and phone fields

## Section 3 — Unsaved Changes Guard
- [ ] S3.1: Create UnsavedChangesGuard client component
- [ ] S3.2: Apply to customer, invoice new, product, payment forms

## Section 4 — Payment Editing
- [ ] S4.1: Add updatePayment server action with balance reversal + audit trail
- [ ] S4.2: Create payments/[id]/edit/page.tsx
- [ ] S4.3: Add Edit link to payments list page

## Section 5 — Cash Advances
- [ ] S5.1: Add creditBalance field to Customer schema (included in same migration as S2.1)
- [ ] S5.2: Update recordPayment to store leftover as creditBalance
- [ ] S5.3: Update invoice creation to allow applying credit
- [ ] S5.4: Update customer detail page to show credit balance

## Section 6 — Product Creation Dropdowns
- [ ] S6.1: Create SelectOrCustom reusable client component
- [ ] S6.2: Update products/new/page.tsx with dropdown fields

## Section 7 — Date Range Filters
- [ ] S7.1: Create DateRangeFilter client component
- [ ] S7.2: Apply to invoices list, payments list, audit log, customer ledger

## Section 8 — Audit Log Improvements
- [ ] S8.1: Add filter bar to audit log page (entity, action, date range, search)
- [ ] S8.2: Add CANCEL badge to audit log action badge map

## Section 9 — General UX Polish
- [ ] S9.1: Add Edit link to payments list
- [ ] S9.2: Add proper loading states with useFormStatus
- [ ] S9.3: Add Back link to invoice pages consistently
