# KGD Account Tracking - Demo Guide

## What This App Is
KGD Account Tracking is a small business management app for a paper plate manufacturing business.

It helps you manage:
- Customers and their contacts
- Invoices and invoice status
- Payments and allocations to invoices
- Inventory stock and stock movements
- Audit logs (who changed what and when)

## Why It Is Useful
This app replaces manual bookkeeping and gives one place to track:
- Who bought what
- Who still has pending balance
- Which invoices are paid/partial/unpaid
- How much raw material is in stock

## Login Roles
- `Admin`: full access (including Audit Log and invoice cancellation)
- `Staff`: day-to-day operations (limited access)

Sample users:
- Admin: `admin@kgd.local` / `admin123`
- Staff: `staff@kgd.local` / `staff123`

## Main Screens (Simple)
1. `Dashboard`
- Quick business summary: outstanding amount, sales, active customers, recent invoices/payments.

2. `Customers`
- Add and edit customer profiles.
- Add contact persons.
- View customer ledger (invoices + payments timeline).

3. `Invoices`
- Create invoices with line items.
- Track status: `Unpaid`, `Partial`, `Paid`, `Cancelled`.
- Open print-friendly invoice view.

4. `Payments`
- Record payments and map them to one or more invoices.
- Auto-updates invoice paid amount and balance.

5. `Products`
- Master list of product variants (size/GSM/color/rate suggestions).

6. `Inventory`
- Track raw material items and movements (`PURCHASE`, `USAGE`, `ADJUSTMENT`).
- See current stock.

7. `Audit Log` (Admin only)
- Shows important create/update/delete actions.

## Demo Flow (10-15 Minutes)
Follow this exact order for a smooth demo:

1. Login as Admin
- Open `/login`
- Sign in with admin credentials.
- Show dashboard summary cards.

2. Show Customers
- Open `Customers`.
- Open an existing customer.
- Show:
  - Basic details
  - Contacts
  - Ledger timeline

3. Create a New Customer
- Click `New Customer`.
- Fill name + city + discount.
- Save and show customer detail page.

4. Add a Contact
- In that customer page, add a contact person.
- Show contact appears immediately.

5. Create an Invoice
- From customer page click `+ New Invoice`.
- Add line item (description, qty, rate).
- Save invoice.
- Point out:
  - Invoice number
  - Total
  - Status (`Unpaid`)

6. Record a Partial Payment
- Click `Record Payment` from invoice or payments page.
- Enter amount less than total.
- Save.
- Return to invoice and show status changed to `Partial`.

7. Record Remaining Payment
- Add second payment for remaining balance.
- Show invoice status becomes `Paid`.

8. Show Customer Ledger
- Open customer again and show:
  - Invoice entries
  - Payment entries
  - Balance impact

9. Show Print Invoice
- Open invoice print page.
- Explain this can be printed/shared for billing.

10. Show Inventory
- Open inventory page.
- Explain purchases increase stock, usage decreases stock.

11. Show Audit Log
- Open audit log.
- Show recent entries for customer/invoice/payment updates.

12. (Optional) Role-Based Access
- Logout and login as staff.
- Try opening audit page and show redirect/denied behavior.

## Key Business Logic to Mention
- Invoice total = sum of all line items (minus discount if any).
- Payment can be allocated to invoices.
- Invoice status auto-updates based on paid amount.
- Every important action can be traced in audit logs.

## Demo Tips
- Keep language simple: “created customer → created invoice → received payment → balance reduced”.
- Use one customer end-to-end so story stays clear.
- If asked “is data realistic?” mention 4 months of sample records were seeded.

## Quick Commands (Before Demo)
From `kgd-app`:

```bash
npm install
npm run db:seed
npm run dev
```

Then open: `http://localhost:3000`

