# KGD Account Tracking - Manual Test Cases

## Scope
Manual regression checks for:
- Auth and role access
- Customers and contacts
- Invoices and print flow
- Payments and ledger updates
- Audit log visibility and records

## Test Data
- Admin user: `admin@kgd.local` / `admin123`
- Staff user: `staff@kgd.local` / `staff123`
- Customer name pattern: `Manual Customer <timestamp>`
- Invoice line item sample: `10 inch Silver Plate`, qty `10`, rate `90`

## Environment
- Start app from `kgd-app`: `npm run dev`
- Base URL: `http://localhost:3000`
- Browser: Chrome (latest), then one secondary browser if possible

## Test Cases

### Authentication
1. Login with valid admin credentials
- Steps: Open `/login`, enter admin credentials, click Sign In.
- Expected: Redirect to `/dashboard`, admin identity visible in sidebar.

2. Login with valid staff credentials
- Steps: Open `/login`, enter staff credentials, click Sign In.
- Expected: Redirect to `/dashboard`, staff identity visible.

3. Login with invalid password
- Steps: Use valid email + wrong password.
- Expected: Login fails with clear error message, remains on `/login`.

4. Sign out
- Steps: From any authenticated page click `Sign Out`.
- Expected: Session cleared, redirect to `/login`, protected pages require login again.

### Authorization and Access Control
5. Staff cannot access audit log
- Steps: Login as staff, open `/audit`.
- Expected: Redirected to `/dashboard` (or access denied page if implemented).

6. Admin can access audit log
- Steps: Login as admin, open `/audit`.
- Expected: Audit page loads with table headers and rows (or empty state).

7. Unauthenticated user blocked from protected pages
- Steps: Logout, open `/customers`, `/invoices`, `/payments`, `/audit`.
- Expected: Redirect to `/login` each time.

### Customers
8. Create customer with required fields only
- Steps: Open `/customers/new`, fill Name only, save.
- Expected: Redirect to customer detail page; new customer visible in list.

9. Create customer with all optional fields
- Steps: Fill name, business name, city, address, notes, discount.
- Expected: All values persist on detail/edit pages.

10. Validation: empty customer name
- Steps: Submit customer form with blank name.
- Expected: Submission blocked with validation feedback.

11. Edit customer details
- Steps: Open customer edit, update city/notes, save.
- Expected: Redirect to detail page with updated values visible.

12. Customer detail ledger empty state
- Steps: Open a customer with no invoices/payments.
- Expected: `No transactions yet.` displayed.

13. New Invoice navigation from customer page
- Steps: Click `+ New Invoice` on customer detail.
- Expected: Opens invoice create page with customer pre-selected.

### Contacts
14. Add contact with only required name
- Steps: Add contact name only, submit.
- Expected: Contact appears in customer contact list.

15. Add contact with phone + role
- Steps: Add name, phone, role, submit.
- Expected: Full contact info appears correctly.

16. Add contact with blank optional fields
- Steps: Leave phone/role blank.
- Expected: No runtime error; contact still added.

17. Set contact as primary
- Steps: Add or edit contact as primary.
- Expected: Primary badge shown; previous primary is unset.

### Invoices
18. Create invoice from invoices/new with selected customer
- Steps: Open `/invoices/new`, choose customer, add one line item, save.
- Expected: Redirect to invoice detail; invoice number generated.

19. Create invoice from customer prefilled link
- Steps: Start from customer detail `+ New Invoice`.
- Expected: Customer is pre-selected in form.

20. Validation: invoice with missing line description
- Steps: Leave line description empty and submit.
- Expected: Validation blocks submission.

21. Validation: invoice with zero/negative quantity or rate
- Steps: Enter invalid numeric values.
- Expected: Validation blocks submission.

22. Invoice totals math
- Steps: Create invoice with known values.
- Expected: Subtotal/discount/total/balance values are mathematically correct.

23. Invoice status on create
- Steps: Create invoice with no payment.
- Expected: Status displayed as `Unpaid`.

24. Cancel invoice (admin)
- Steps: Open active invoice as admin, click Cancel.
- Expected: Status becomes `Cancelled`, action is reflected in list/detail.

25. Print page renders invoice content
- Steps: Open `/invoices/<id>/print`.
- Expected: Invoice number, customer, line items, totals visible; print dialog may open.

### Payments
26. Payment form prefilled from query params
- Steps: Open `/payments/new?customerId=<id>&invoiceId=<id>`.
- Expected: Customer preselected, invoice checked/open.

27. Record partial payment
- Steps: Pay less than balance.
- Expected: Invoice status updates to `Partial`; balance decreases.

28. Record remaining payment
- Steps: Pay exact remaining amount.
- Expected: Invoice status updates to `Paid`; balance reaches zero.

29. Overpayment attempt
- Steps: Enter payment > outstanding amount.
- Expected: Either blocked by validation or clearly handled by business rule.

30. Payment list entry
- Steps: Open `/payments` after payment.
- Expected: New payment row visible with customer, method, amount, date.

31. Customer ledger reflects payment
- Steps: Open customer detail ledger after payment.
- Expected: `Payment via <method>` entry visible with correct amount.

### Audit and Data Integrity
32. Audit entry on customer create/update
- Steps: Create and edit customer as admin.
- Expected: Audit log contains entries with entity/action and actor.

33. Audit entry on invoice create/cancel
- Steps: Create invoice then cancel it.
- Expected: Audit log contains both actions.

34. Audit entry on payment creation
- Steps: Record payment.
- Expected: Audit log captures payment-related action.

35. Cross-page consistency check
- Steps: Compare invoice status and amounts on dashboard, customer ledger, invoice detail, and payments list.
- Expected: Values and status are consistent across all pages.

### Negative and Edge Cases
36. Session expiry during form submit
- Steps: Let session expire or clear cookies before submit.
- Expected: Redirect to login or clear auth error; no silent failure.

37. Double-click submit on create forms
- Steps: Double-click Save/Create buttons quickly.
- Expected: No duplicate records created.

38. Refresh during redirect after submit
- Steps: Submit customer/invoice and refresh immediately.
- Expected: Record not duplicated; final page stable.

39. Browser back/forward after mutations
- Steps: Create/edit record, use browser back and forward.
- Expected: No crash; stale pages recover after refresh.

40. Unicode and long text
- Steps: Use long names/notes with non-ASCII input.
- Expected: Data saved and rendered without truncation bugs or crashes.

## Exit Criteria
- All critical flows (Auth, Customer, Invoice, Payment, Audit) pass.
- No console/runtime errors during manual walkthrough.
- No mismatches between ledger, invoice detail, and payments list.
