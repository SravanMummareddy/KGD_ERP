# Paper Plate Factory Management System
Business Requirements Document

Author: Sravan & Team  
Version: 0.1  
Status: Draft

---

# 1. Overview

This application will help manage the daily operations of a paper plate manufacturing business.

The goal is to replace manual notebook-based tracking with a digital system that can manage:

- Customers
- Product sales
- Billing and invoices
- Customer-specific pricing
- Payments and credit balances
- Inventory of raw materials
- Business expenses
- Employee salaries
- Business reports

The system should be simple enough for non-technical users while providing accurate records of business transactions.

---

# 2. Current Process (Manual)

Currently the business tracks everything in notebooks.

Main sections recorded manually:

1. Customers
2. Product sales
3. Raw material purchases
4. Employee salaries
5. Expenses
6. Monthly reports

Problems with the current system:

- Hard to track customer balances
- No quick sales summary
- Inventory not automatically calculated
- Difficult to find historical data
- Risk of losing records

---

# 3. Goals of the System

The main goals of this system are:

- Digitize customer records
- Generate bills for sales
- Track payments and pending balances
- Manage product pricing
- Track inventory purchases
- Maintain employee salary records
- Generate basic business reports

The system should reduce manual bookkeeping and improve visibility of business performance.

---

# 4. Users of the System

## 4.1 Admin (Owner)

The owner has full control of the system.

Permissions:

- Manage customers
- Manage products
- Create invoices
- Record payments
- View reports
- Manage employees
- Manage inventory
- Manage expenses
- Manage users

Example user:  
Factory owner (Dad)

---

## 4.2 Staff

Staff may be allowed to operate the billing system.

Permissions:

- Create invoices
- Record payments
- View customers
- View products

Restricted actions:

- Cannot delete records
- Cannot change system settings
- Cannot manage users

Example user:  
Factory worker or manager

---

# 5. Core Business Entities

The following entities exist in the business.

## 5.1 Customers

Customers are shops, distributors, or catering businesses that purchase plates.

Customer fields:

- Customer ID
- Name
- Phone number
- Address
- Notes
- Default discount (optional)

Example:

Sai Catering  
Phone: 9876543210  
Address: Vijayawada

---

## 5.2 Products

Products are items sold by the factory.

Two main product types:

### Plates

Attributes:

- Size (inches)
- GSM (paper thickness)
- Color
- Plates per packet
- Default rate per packet

Example:

10 inch silver plate  
120 GSM  
50 plates per packet  
₹90 per packet

---

### Sheets

Sheets are raw paper sheets sold to other manufacturers.

Attributes:

- Size (inches)
- GSM
- Color
- Sheets per packet
- Default rate

---

## 5.3 Customer Specific Pricing

Some customers receive special pricing based on:

- Relationship
- Order quantity
- Long-term business

The system must support:

- default product price
- customer-specific price
- manual override during billing

Example:

Product default rate = ₹90  
Customer A rate = ₹85  
Customer B rate = ₹80

---

# 6. Sales and Billing

The system must support invoice creation.

Each invoice contains:

- Invoice number
- Date
- Customer
- List of products
- Quantity
- Rate
- Discount
- Total amount
- Payment received
- Balance remaining

Example invoice:

Customer: Sai Catering

Items:

10 inch plate  
20 packets  
₹90 rate

Subtotal: ₹1800  
Discount: ₹100  

Final Total: ₹1700  

Amount Paid: ₹1000  
Balance Due: ₹700

---

# 7. Payments

Customers may pay:

- immediately
- partially
- later

The system must track:

- payment amount
- payment date
- payment method (optional)
- remaining balance

Customer ledger must show:

- invoices
- payments
- outstanding balance

---

# 8. Inventory (Future Phase)

Inventory management will track raw materials.

Examples:

- Brown paper rolls
- Threads
- Films
- Gum bags
- Packing covers
- Packing strips

Fields for inventory purchase:

- Material name
- Quantity
- Weight
- Rate
- Total price
- Purchase date

Inventory features will be implemented in later phases.

---

# 9. Employees (Future Phase)

The system may track employees.

Fields:

- Employee name
- Role
- Daily wage or monthly salary
- Working hours
- Salary payments

---

# 10. Expenses (Future Phase)

Other expenses may be recorded.

Examples:

- Transport
- Machine maintenance
- Local purchases
- Electricity
- Miscellaneous costs

---

# 11. Reports

The system should eventually generate reports.

Examples:

Daily sales report  
Monthly sales report  
Customer outstanding balances  
Inventory summary  
Expense summary  
Profit estimation

Reports will be implemented in later phases.

---

# 12. MVP Scope (Version 1)

The first version of the system will include:

- Login system
- Customer management
- Product management
- Invoice creation
- Payment recording
- Customer balance tracking
- Basic dashboard

Excluded from V1:

- inventory automation
- employee management
- expense tracking
- advanced reporting
- GST billing

---

# 13. Technology Stack (Proposed)

Frontend:  
Next.js

Backend:  
Next.js API routes

Database:  
PostgreSQL

ORM:  
Prisma

Authentication:  
Basic login with roles

Hosting:  
TBD

---

# 14. Future Enhancements

Possible improvements in later versions:

- inventory automation
- worker attendance tracking
- GST billing support
- WhatsApp invoice sharing
- PDF invoice export
- mobile friendly UI
- analytics dashboard

---

# 15. Open Questions

These need clarification from the business owner.

1. Do invoices require GST?
2. Are products always sold in packets?
3. Can one invoice contain multiple products?
4. How often do product prices change?
5. Do customers usually pay immediately or later?
6. Do we need printed invoices?
7. Should the system track production quantities?

These questions must be answered before development.

---
