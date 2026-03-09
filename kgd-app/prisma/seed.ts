import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function d(dateStr: string): Date {
    return new Date(`${dateStr}T10:00:00.000Z`)
}

async function main() {
    console.log('Seeding database with realistic sample data...')

    const adminHash = await bcrypt.hash('admin123', 12)
    const staffHash = await bcrypt.hash('staff123', 12)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@kgd.local' },
        update: { name: 'Admin', role: 'ADMIN', isActive: true },
        create: {
            id: 'seed-user-admin',
            name: 'Admin',
            email: 'admin@kgd.local',
            passwordHash: adminHash,
            role: 'ADMIN',
        },
    })

    const staff = await prisma.user.upsert({
        where: { email: 'staff@kgd.local' },
        update: { name: 'Staff User', role: 'STAFF', isActive: true },
        create: {
            id: 'seed-user-staff',
            name: 'Staff User',
            email: 'staff@kgd.local',
            passwordHash: staffHash,
            role: 'STAFF',
        },
    })

    // Cleanup seed rows so this script is idempotent.
    await prisma.paymentAllocation.deleteMany({ where: { id: { startsWith: 'seed-' } } })
    await prisma.payment.deleteMany({ where: { id: { startsWith: 'seed-' } } })
    await prisma.invoiceItem.deleteMany({ where: { id: { startsWith: 'seed-' } } })
    await prisma.invoice.deleteMany({ where: { id: { startsWith: 'seed-' } } })
    await prisma.customerContact.deleteMany({ where: { id: { startsWith: 'seed-' } } })
    await prisma.customer.deleteMany({ where: { id: { startsWith: 'seed-' } } })
    await prisma.inventoryTransaction.deleteMany({ where: { id: { startsWith: 'seed-' } } })
    await prisma.auditLog.deleteMany({ where: { id: { startsWith: 'seed-' } } })

    const products = [
        { id: 'seed-prod-10-silver-80', name: '10 inch Silver Plate 80 GSM', type: 'PLATE' as const, sizeInches: 10, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 90 },
        { id: 'seed-prod-10-gold-80', name: '10 inch Gold Plate 80 GSM', type: 'PLATE' as const, sizeInches: 10, gsm: 80, color: 'Gold', unitLabel: 'packet', defaultRate: 95 },
        { id: 'seed-prod-12-silver-80', name: '12 inch Silver Plate 80 GSM', type: 'PLATE' as const, sizeInches: 12, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 110 },
        { id: 'seed-prod-14-silver-80', name: '14 inch Silver Plate 80 GSM', type: 'PLATE' as const, sizeInches: 14, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 130 },
        { id: 'seed-prod-10-green-80', name: '10 inch Green Plate 80 GSM', type: 'PLATE' as const, sizeInches: 10, gsm: 80, color: 'Green', unitLabel: 'packet', defaultRate: 92 },
        { id: 'seed-prod-sheet-700-70', name: 'Sheet 700mm 70 GSM', type: 'SHEET' as const, sizeInches: null, gsm: 70, color: null, unitLabel: 'kg', defaultRate: 32.5 },
        { id: 'seed-prod-sheet-700-80', name: 'Sheet 700mm 80 GSM', type: 'SHEET' as const, sizeInches: null, gsm: 80, color: null, unitLabel: 'kg', defaultRate: 35 },
        { id: 'seed-prod-sheet-640-120', name: 'Sheet 640mm 120 GSM', type: 'SHEET' as const, sizeInches: null, gsm: 120, color: null, unitLabel: 'kg', defaultRate: 40 },
    ]

    for (const p of products) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: {
                name: p.name,
                type: p.type,
                sizeInches: p.sizeInches,
                gsm: p.gsm,
                color: p.color,
                unitLabel: p.unitLabel,
                defaultRate: p.defaultRate,
                isActive: true,
            },
            create: p,
        })
    }

    const inventoryItems = [
        { id: 'seed-inv-brown-700-70', name: 'Brown Paper 700mm 70 GSM', category: 'Brown Paper', unit: 'kg' },
        { id: 'seed-inv-brown-700-80', name: 'Brown Paper 700mm 80 GSM', category: 'Brown Paper', unit: 'kg' },
        { id: 'seed-inv-brown-640-120', name: 'Brown Paper 640mm 120 GSM', category: 'Brown Paper', unit: 'kg' },
        { id: 'seed-inv-threads', name: 'Threads', category: 'Threads', unit: 'kg' },
        { id: 'seed-inv-silver-film', name: 'Silver Film', category: 'Films', unit: 'kg' },
        { id: 'seed-inv-gold-film', name: 'Gold Film', category: 'Films', unit: 'kg' },
        { id: 'seed-inv-gum-bags', name: 'Gum Bags', category: 'Gum Bags', unit: 'piece' },
        { id: 'seed-inv-pp-covers', name: 'PP Covers', category: 'Covers', unit: 'piece' },
        { id: 'seed-inv-luggage-covers', name: 'Luggage Covers', category: 'Covers', unit: 'piece' },
        { id: 'seed-inv-packing-strips', name: 'Packing Strips', category: 'Packing', unit: 'piece' },
        { id: 'seed-inv-packing-rolls', name: 'Packing Rolls', category: 'Packing', unit: 'roll' },
    ]

    for (const item of inventoryItems) {
        await prisma.inventoryItem.upsert({
            where: { id: item.id },
            update: {
                name: item.name,
                category: item.category,
                unit: item.unit,
                isActive: true,
            },
            create: {
                ...item,
                currentStock: 0,
            },
        })
    }

    const customers = [
        {
            id: 'seed-cust-annapurna',
            name: 'Annapurna Catering Services',
            businessName: 'Annapurna Events',
            city: 'Vijayawada',
            address: 'MG Road, Vijayawada',
            defaultDiscount: 4,
            notes: 'Bulk orders for weddings and events',
            contacts: [
                { id: 'seed-contact-annapurna-1', name: 'Ravi Kumar', phone: '9876543210', role: 'Owner', isPrimary: true },
                { id: 'seed-contact-annapurna-2', name: 'Sowmya R', phone: '9700011223', role: 'Accounts', isPrimary: false },
            ],
        },
        {
            id: 'seed-cust-lakshmi',
            name: 'Sri Lakshmi Tiffins',
            businessName: 'Lakshmi Foods',
            city: 'Guntur',
            address: 'Brodipet, Guntur',
            defaultDiscount: 2,
            notes: 'Weekly recurring customer',
            contacts: [
                { id: 'seed-contact-lakshmi-1', name: 'Prasad', phone: '9988776655', role: 'Manager', isPrimary: true },
            ],
        },
        {
            id: 'seed-cust-greenleaf',
            name: 'Green Leaf Banquets',
            businessName: 'Green Leaf Banquets Pvt Ltd',
            city: 'Hyderabad',
            address: 'Madhapur, Hyderabad',
            defaultDiscount: 5,
            notes: 'High value monthly orders',
            contacts: [
                { id: 'seed-contact-greenleaf-1', name: 'Nikhil Rao', phone: '9012345678', role: 'Procurement', isPrimary: true },
            ],
        },
        {
            id: 'seed-cust-sai',
            name: 'Sai Mess & Caterers',
            businessName: 'Sai Mess',
            city: 'Tenali',
            address: 'Market Street, Tenali',
            defaultDiscount: 0,
            notes: 'Small but regular buyer',
            contacts: [
                { id: 'seed-contact-sai-1', name: 'Venkatesh', phone: '9123456780', role: 'Owner', isPrimary: true },
            ],
        },
        {
            id: 'seed-cust-nandini',
            name: 'Nandini Fast Foods',
            businessName: 'Nandini Snacks',
            city: 'Ongole',
            address: 'Trunk Road, Ongole',
            defaultDiscount: 1.5,
            notes: 'Usually pays within 7 days',
            contacts: [
                { id: 'seed-contact-nandini-1', name: 'Harika', phone: '9345678901', role: 'Owner', isPrimary: true },
            ],
        },
        {
            id: 'seed-cust-random-1',
            name: 'Urban Bite Corner',
            businessName: 'Urban Bite',
            city: 'Nellore',
            address: 'Main Bazaar, Nellore',
            defaultDiscount: 0,
            notes: 'Random test account',
            contacts: [
                { id: 'seed-contact-random-1', name: 'Arun P', phone: '9555123412', role: 'Cashier', isPrimary: true },
            ],
        },
    ]

    for (const c of customers) {
        await prisma.customer.create({
            data: {
                id: c.id,
                name: c.name,
                businessName: c.businessName,
                city: c.city,
                address: c.address,
                defaultDiscount: c.defaultDiscount,
                notes: c.notes,
                contacts: {
                    create: c.contacts,
                },
            },
        })
    }

    type SeedInvoice = {
        id: string
        invoiceNumber: string
        customerId: string
        invoiceDate: string
        dueDate: string
        total: number
        paid: number
        status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED'
        createdById: string
        items: Array<{
            id: string
            productId: string
            description: string
            quantity: number
            unit: string
            rate: number
            amount: number
            sortOrder: number
        }>
    }

    const invoices: SeedInvoice[] = [
        {
            id: 'seed-invoice-001',
            invoiceNumber: 'KGD-2025-1201',
            customerId: 'seed-cust-annapurna',
            invoiceDate: '2025-12-05',
            dueDate: '2025-12-20',
            total: 7200,
            paid: 7200,
            status: 'PAID',
            createdById: admin.id,
            items: [
                { id: 'seed-item-001-1', productId: 'seed-prod-10-silver-80', description: '10 inch Silver Plate 80 GSM', quantity: 40, unit: 'packet', rate: 90, amount: 3600, sortOrder: 0 },
                { id: 'seed-item-001-2', productId: 'seed-prod-12-silver-80', description: '12 inch Silver Plate 80 GSM', quantity: 30, unit: 'packet', rate: 120, amount: 3600, sortOrder: 1 },
            ],
        },
        {
            id: 'seed-invoice-002',
            invoiceNumber: 'KGD-2025-1202',
            customerId: 'seed-cust-lakshmi',
            invoiceDate: '2025-12-14',
            dueDate: '2025-12-28',
            total: 2850,
            paid: 2850,
            status: 'PAID',
            createdById: staff.id,
            items: [
                { id: 'seed-item-002-1', productId: 'seed-prod-10-gold-80', description: '10 inch Gold Plate 80 GSM', quantity: 30, unit: 'packet', rate: 95, amount: 2850, sortOrder: 0 },
            ],
        },
        {
            id: 'seed-invoice-003',
            invoiceNumber: 'KGD-2026-0101',
            customerId: 'seed-cust-greenleaf',
            invoiceDate: '2026-01-08',
            dueDate: '2026-01-22',
            total: 15000,
            paid: 10000,
            status: 'PARTIAL',
            createdById: admin.id,
            items: [
                { id: 'seed-item-003-1', productId: 'seed-prod-14-silver-80', description: '14 inch Silver Plate 80 GSM', quantity: 60, unit: 'packet', rate: 130, amount: 7800, sortOrder: 0 },
                { id: 'seed-item-003-2', productId: 'seed-prod-10-green-80', description: '10 inch Green Plate 80 GSM', quantity: 50, unit: 'packet', rate: 92, amount: 4600, sortOrder: 1 },
                { id: 'seed-item-003-3', productId: 'seed-prod-12-silver-80', description: '12 inch Silver Plate 80 GSM', quantity: 20, unit: 'packet', rate: 130, amount: 2600, sortOrder: 2 },
            ],
        },
        {
            id: 'seed-invoice-004',
            invoiceNumber: 'KGD-2026-0102',
            customerId: 'seed-cust-sai',
            invoiceDate: '2026-01-18',
            dueDate: '2026-01-30',
            total: 4200,
            paid: 2200,
            status: 'PARTIAL',
            createdById: staff.id,
            items: [
                { id: 'seed-item-004-1', productId: 'seed-prod-10-silver-80', description: '10 inch Silver Plate 80 GSM', quantity: 20, unit: 'packet', rate: 90, amount: 1800, sortOrder: 0 },
                { id: 'seed-item-004-2', productId: 'seed-prod-12-silver-80', description: '12 inch Silver Plate 80 GSM', quantity: 20, unit: 'packet', rate: 120, amount: 2400, sortOrder: 1 },
            ],
        },
        {
            id: 'seed-invoice-005',
            invoiceNumber: 'KGD-2026-0201',
            customerId: 'seed-cust-annapurna',
            invoiceDate: '2026-02-03',
            dueDate: '2026-02-18',
            total: 9600,
            paid: 3000,
            status: 'PARTIAL',
            createdById: admin.id,
            items: [
                { id: 'seed-item-005-1', productId: 'seed-prod-10-silver-80', description: '10 inch Silver Plate 80 GSM', quantity: 50, unit: 'packet', rate: 90, amount: 4500, sortOrder: 0 },
                { id: 'seed-item-005-2', productId: 'seed-prod-10-gold-80', description: '10 inch Gold Plate 80 GSM', quantity: 30, unit: 'packet', rate: 95, amount: 2850, sortOrder: 1 },
                { id: 'seed-item-005-3', productId: 'seed-prod-12-silver-80', description: '12 inch Silver Plate 80 GSM', quantity: 15, unit: 'packet', rate: 150, amount: 2250, sortOrder: 2 },
            ],
        },
        {
            id: 'seed-invoice-006',
            invoiceNumber: 'KGD-2026-0202',
            customerId: 'seed-cust-nandini',
            invoiceDate: '2026-02-11',
            dueDate: '2026-02-25',
            total: 3100,
            paid: 3100,
            status: 'PAID',
            createdById: staff.id,
            items: [
                { id: 'seed-item-006-1', productId: 'seed-prod-10-green-80', description: '10 inch Green Plate 80 GSM', quantity: 20, unit: 'packet', rate: 92, amount: 1840, sortOrder: 0 },
                { id: 'seed-item-006-2', productId: 'seed-prod-10-silver-80', description: '10 inch Silver Plate 80 GSM', quantity: 14, unit: 'packet', rate: 90, amount: 1260, sortOrder: 1 },
            ],
        },
        {
            id: 'seed-invoice-007',
            invoiceNumber: 'KGD-2026-0301',
            customerId: 'seed-cust-greenleaf',
            invoiceDate: '2026-03-02',
            dueDate: '2026-03-17',
            total: 11200,
            paid: 0,
            status: 'UNPAID',
            createdById: admin.id,
            items: [
                { id: 'seed-item-007-1', productId: 'seed-prod-14-silver-80', description: '14 inch Silver Plate 80 GSM', quantity: 40, unit: 'packet', rate: 130, amount: 5200, sortOrder: 0 },
                { id: 'seed-item-007-2', productId: 'seed-prod-12-silver-80', description: '12 inch Silver Plate 80 GSM', quantity: 40, unit: 'packet', rate: 120, amount: 4800, sortOrder: 1 },
                { id: 'seed-item-007-3', productId: 'seed-prod-10-gold-80', description: '10 inch Gold Plate 80 GSM', quantity: 12, unit: 'packet', rate: 100, amount: 1200, sortOrder: 2 },
            ],
        },
        {
            id: 'seed-invoice-008',
            invoiceNumber: 'KGD-2026-0302',
            customerId: 'seed-cust-random-1',
            invoiceDate: '2026-03-05',
            dueDate: '2026-03-19',
            total: 2500,
            paid: 0,
            status: 'UNPAID',
            createdById: staff.id,
            items: [
                { id: 'seed-item-008-1', productId: 'seed-prod-10-silver-80', description: '10 inch Silver Plate 80 GSM', quantity: 20, unit: 'packet', rate: 90, amount: 1800, sortOrder: 0 },
                { id: 'seed-item-008-2', productId: 'seed-prod-10-green-80', description: '10 inch Green Plate 80 GSM', quantity: 8, unit: 'packet', rate: 87.5, amount: 700, sortOrder: 1 },
            ],
        },
        {
            id: 'seed-invoice-009',
            invoiceNumber: 'KGD-2026-0303',
            customerId: 'seed-cust-lakshmi',
            invoiceDate: '2026-03-07',
            dueDate: '2026-03-21',
            total: 3600,
            paid: 3600,
            status: 'PAID',
            createdById: admin.id,
            items: [
                { id: 'seed-item-009-1', productId: 'seed-prod-10-silver-80', description: '10 inch Silver Plate 80 GSM', quantity: 40, unit: 'packet', rate: 90, amount: 3600, sortOrder: 0 },
            ],
        },
        {
            id: 'seed-invoice-010',
            invoiceNumber: 'KGD-2026-0203',
            customerId: 'seed-cust-nandini',
            invoiceDate: '2026-02-20',
            dueDate: '2026-03-02',
            total: 2800,
            paid: 0,
            status: 'CANCELLED',
            createdById: admin.id,
            items: [
                { id: 'seed-item-010-1', productId: 'seed-prod-10-gold-80', description: '10 inch Gold Plate 80 GSM', quantity: 28, unit: 'packet', rate: 100, amount: 2800, sortOrder: 0 },
            ],
        },
    ]

    for (const inv of invoices) {
        await prisma.invoice.create({
            data: {
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                customerId: inv.customerId,
                invoiceDate: d(inv.invoiceDate),
                dueDate: d(inv.dueDate),
                subtotal: inv.total,
                discountAmount: 0,
                totalAmount: inv.total,
                paidAmount: inv.paid,
                balanceDue: Math.max(inv.total - inv.paid, 0),
                status: inv.status,
                createdById: inv.createdById,
                items: {
                    create: inv.items,
                },
            },
        })
    }

    const payments = [
        { id: 'seed-payment-001', customerId: 'seed-cust-annapurna', amount: 7200, paymentDate: '2025-12-20', method: 'BANK_TRANSFER' as const, reference: 'NEFT-20251220-001', createdById: admin.id },
        { id: 'seed-payment-002', customerId: 'seed-cust-lakshmi', amount: 2850, paymentDate: '2025-12-27', method: 'CASH' as const, reference: null, createdById: staff.id },
        { id: 'seed-payment-003', customerId: 'seed-cust-greenleaf', amount: 6000, paymentDate: '2026-01-20', method: 'UPI' as const, reference: 'UPI-GL-1201', createdById: admin.id },
        { id: 'seed-payment-004', customerId: 'seed-cust-greenleaf', amount: 4000, paymentDate: '2026-02-02', method: 'CHEQUE' as const, reference: 'CHQ-778812', createdById: admin.id },
        { id: 'seed-payment-005', customerId: 'seed-cust-sai', amount: 2200, paymentDate: '2026-01-28', method: 'CASH' as const, reference: null, createdById: staff.id },
        { id: 'seed-payment-006', customerId: 'seed-cust-annapurna', amount: 3000, paymentDate: '2026-02-16', method: 'UPI' as const, reference: 'UPI-AN-2309', createdById: admin.id },
        { id: 'seed-payment-007', customerId: 'seed-cust-nandini', amount: 3100, paymentDate: '2026-02-24', method: 'BANK_TRANSFER' as const, reference: 'NEFT-20260224-331', createdById: staff.id },
        { id: 'seed-payment-008', customerId: 'seed-cust-lakshmi', amount: 3600, paymentDate: '2026-03-08', method: 'UPI' as const, reference: 'UPI-LK-8302', createdById: admin.id },
    ]

    for (const pay of payments) {
        await prisma.payment.create({
            data: {
                ...pay,
                paymentDate: d(pay.paymentDate),
            },
        })
    }

    const allocations = [
        { id: 'seed-alloc-001', paymentId: 'seed-payment-001', invoiceId: 'seed-invoice-001', amount: 7200 },
        { id: 'seed-alloc-002', paymentId: 'seed-payment-002', invoiceId: 'seed-invoice-002', amount: 2850 },
        { id: 'seed-alloc-003', paymentId: 'seed-payment-003', invoiceId: 'seed-invoice-003', amount: 6000 },
        { id: 'seed-alloc-004', paymentId: 'seed-payment-004', invoiceId: 'seed-invoice-003', amount: 4000 },
        { id: 'seed-alloc-005', paymentId: 'seed-payment-005', invoiceId: 'seed-invoice-004', amount: 2200 },
        { id: 'seed-alloc-006', paymentId: 'seed-payment-006', invoiceId: 'seed-invoice-005', amount: 3000 },
        { id: 'seed-alloc-007', paymentId: 'seed-payment-007', invoiceId: 'seed-invoice-006', amount: 3100 },
        { id: 'seed-alloc-008', paymentId: 'seed-payment-008', invoiceId: 'seed-invoice-009', amount: 3600 },
    ]

    for (const alloc of allocations) {
        await prisma.paymentAllocation.create({ data: alloc })
    }

    const inventoryTransactions = [
        { id: 'seed-itx-001', inventoryItemId: 'seed-inv-brown-700-70', type: 'PURCHASE' as const, quantity: 850, rate: 32.5, transactionDate: '2025-12-02', createdById: admin.id, notes: 'Monthly raw material purchase' },
        { id: 'seed-itx-002', inventoryItemId: 'seed-inv-brown-700-80', type: 'PURCHASE' as const, quantity: 920, rate: 35, transactionDate: '2025-12-06', createdById: admin.id, notes: 'Supplier: Ravi Papers' },
        { id: 'seed-itx-003', inventoryItemId: 'seed-inv-silver-film', type: 'PURCHASE' as const, quantity: 120, rate: 180, transactionDate: '2025-12-07', createdById: staff.id, notes: 'Silver film rolls' },
        { id: 'seed-itx-004', inventoryItemId: 'seed-inv-gold-film', type: 'PURCHASE' as const, quantity: 70, rate: 210, transactionDate: '2025-12-07', createdById: staff.id, notes: 'Gold film rolls' },
        { id: 'seed-itx-005', inventoryItemId: 'seed-inv-threads', type: 'PURCHASE' as const, quantity: 42, rate: 95, transactionDate: '2025-12-10', createdById: admin.id, notes: 'Thread stock refill' },
        { id: 'seed-itx-006', inventoryItemId: 'seed-inv-brown-700-70', type: 'USAGE' as const, quantity: -240, rate: null, transactionDate: '2026-01-05', createdById: staff.id, notes: 'Production usage - Jan week 1' },
        { id: 'seed-itx-007', inventoryItemId: 'seed-inv-brown-700-80', type: 'USAGE' as const, quantity: -280, rate: null, transactionDate: '2026-01-11', createdById: staff.id, notes: 'Production usage - Jan week 2' },
        { id: 'seed-itx-008', inventoryItemId: 'seed-inv-silver-film', type: 'USAGE' as const, quantity: -44, rate: null, transactionDate: '2026-01-12', createdById: staff.id, notes: 'Lamination usage' },
        { id: 'seed-itx-009', inventoryItemId: 'seed-inv-gold-film', type: 'USAGE' as const, quantity: -28, rate: null, transactionDate: '2026-01-13', createdById: staff.id, notes: 'Lamination usage' },
        { id: 'seed-itx-010', inventoryItemId: 'seed-inv-brown-700-70', type: 'PURCHASE' as const, quantity: 700, rate: 33.2, transactionDate: '2026-01-25', createdById: admin.id, notes: 'Mid-cycle purchase' },
        { id: 'seed-itx-011', inventoryItemId: 'seed-inv-brown-700-80', type: 'PURCHASE' as const, quantity: 750, rate: 35.8, transactionDate: '2026-01-28', createdById: admin.id, notes: 'Mid-cycle purchase' },
        { id: 'seed-itx-012', inventoryItemId: 'seed-inv-brown-700-70', type: 'USAGE' as const, quantity: -310, rate: null, transactionDate: '2026-02-06', createdById: staff.id, notes: 'Production usage - Feb week 1' },
        { id: 'seed-itx-013', inventoryItemId: 'seed-inv-brown-700-80', type: 'USAGE' as const, quantity: -295, rate: null, transactionDate: '2026-02-10', createdById: staff.id, notes: 'Production usage - Feb week 2' },
        { id: 'seed-itx-014', inventoryItemId: 'seed-inv-pp-covers', type: 'PURCHASE' as const, quantity: 1800, rate: 2.2, transactionDate: '2026-02-12', createdById: admin.id, notes: 'Packing material' },
        { id: 'seed-itx-015', inventoryItemId: 'seed-inv-packing-rolls', type: 'PURCHASE' as const, quantity: 55, rate: 145, transactionDate: '2026-02-12', createdById: admin.id, notes: 'Packing roll lot' },
        { id: 'seed-itx-016', inventoryItemId: 'seed-inv-packing-rolls', type: 'USAGE' as const, quantity: -22, rate: null, transactionDate: '2026-02-26', createdById: staff.id, notes: 'Dispatch packaging' },
        { id: 'seed-itx-017', inventoryItemId: 'seed-inv-brown-700-70', type: 'USAGE' as const, quantity: -280, rate: null, transactionDate: '2026-03-03', createdById: staff.id, notes: 'Production usage - Mar week 1' },
        { id: 'seed-itx-018', inventoryItemId: 'seed-inv-brown-700-80', type: 'USAGE' as const, quantity: -260, rate: null, transactionDate: '2026-03-04', createdById: staff.id, notes: 'Production usage - Mar week 1' },
        { id: 'seed-itx-019', inventoryItemId: 'seed-inv-threads', type: 'ADJUSTMENT' as const, quantity: -2, rate: null, transactionDate: '2026-03-06', createdById: admin.id, notes: 'Stock correction after count' },
        { id: 'seed-itx-020', inventoryItemId: 'seed-inv-gum-bags', type: 'PURCHASE' as const, quantity: 6000, rate: 0.35, transactionDate: '2026-03-07', createdById: admin.id, notes: 'Packaging consumables' },
    ]

    for (const tx of inventoryTransactions) {
        await prisma.inventoryTransaction.create({
            data: {
                id: tx.id,
                inventoryItemId: tx.inventoryItemId,
                type: tx.type,
                quantity: tx.quantity,
                rate: tx.rate,
                totalCost: tx.rate ? Math.abs(tx.quantity) * tx.rate : null,
                transactionDate: d(tx.transactionDate),
                notes: tx.notes,
                createdById: tx.createdById,
            },
        })
    }

    // Recalculate stock from transactions for seeded inventory rows.
    for (const item of inventoryItems) {
        const agg = await prisma.inventoryTransaction.aggregate({
            where: { inventoryItemId: item.id },
            _sum: { quantity: true },
        })
        const qty = agg._sum.quantity ?? 0
        await prisma.inventoryItem.update({
            where: { id: item.id },
            data: { currentStock: qty },
        })
    }

    const auditLogs = [
        {
            id: 'seed-audit-001',
            entity: 'Customer',
            entityId: 'seed-cust-annapurna',
            action: 'CREATE',
            newValues: { name: 'Annapurna Catering Services', city: 'Vijayawada' },
            performedBy: admin.id,
            performedAt: d('2025-12-01'),
            ip: '127.0.0.1',
        },
        {
            id: 'seed-audit-002',
            entity: 'Invoice',
            entityId: 'seed-invoice-003',
            action: 'CREATE',
            newValues: { invoiceNumber: 'KGD-2026-0101', totalAmount: 15000, status: 'PARTIAL' },
            performedBy: admin.id,
            performedAt: d('2026-01-08'),
            ip: '127.0.0.1',
        },
        {
            id: 'seed-audit-003',
            entity: 'Payment',
            entityId: 'seed-payment-003',
            action: 'CREATE',
            newValues: { amount: 6000, method: 'UPI', customerId: 'seed-cust-greenleaf' },
            performedBy: admin.id,
            performedAt: d('2026-01-20'),
            ip: '127.0.0.1',
        },
        {
            id: 'seed-audit-004',
            entity: 'Inventory',
            entityId: 'seed-itx-012',
            action: 'CREATE',
            newValues: { item: 'Brown Paper 700mm 70 GSM', type: 'USAGE', quantity: -310 },
            performedBy: staff.id,
            performedAt: d('2026-02-06'),
            ip: '127.0.0.1',
        },
        {
            id: 'seed-audit-005',
            entity: 'Invoice',
            entityId: 'seed-invoice-010',
            action: 'UPDATE',
            oldValues: { status: 'UNPAID' },
            newValues: { status: 'CANCELLED' },
            performedBy: admin.id,
            performedAt: d('2026-02-21'),
            ip: '127.0.0.1',
        },
        {
            id: 'seed-audit-006',
            entity: 'Customer',
            entityId: 'seed-cust-sai',
            action: 'UPDATE',
            oldValues: { city: 'Guntur' },
            newValues: { city: 'Tenali' },
            performedBy: staff.id,
            performedAt: d('2026-03-01'),
            ip: '127.0.0.1',
        },
    ]

    for (const log of auditLogs) {
        await prisma.auditLog.create({ data: log })
    }

    console.log('Seed complete.')
    console.log('Users: admin@kgd.local / admin123, staff@kgd.local / staff123')
    console.log(`Customers: ${customers.length}`)
    console.log(`Invoices: ${invoices.length} (Dec 2025 to Mar 2026)`)
    console.log(`Payments: ${payments.length}`)
    console.log(`Inventory transactions: ${inventoryTransactions.length}`)
    console.log(`Audit logs: ${auditLogs.length}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
