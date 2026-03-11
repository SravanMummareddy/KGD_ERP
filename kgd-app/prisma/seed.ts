import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// --- Generation Helpers ---
function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(arr: readonly T[] | T[]): T {
    return arr[randomInt(0, arr.length - 1)]
}

function randomDate(startStr: string, endStr: string): Date {
    const start = new Date(startStr).getTime()
    const end = new Date(endStr).getTime()
    return new Date(start + Math.random() * (end - start))
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

async function main() {
    console.log('Seeding dynamic, realistic 6-month sample data...')

    // --- 1. Cleanup Existing Seed Data ---
    // (We also wipe out any manual entries to ensure a clean slate, except for real user accounts if we want.
    // For this test, we aggressively clean everything).
    await prisma.paymentAllocation.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.invoiceItem.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.customerContact.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.inventoryTransaction.deleteMany()
    await prisma.inventoryItem.deleteMany()
    await prisma.product.deleteMany()
    await prisma.auditLog.deleteMany()

    // --- 2. Users ---
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
    
    const users = [admin, staff]

    // --- 3. Products ---
    const productsData = [
        { id: 'prod-10-silver-80', name: '10 inch Silver Plate 80 GSM', type: 'PLATE', sizeInches: 10, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 90 },
        { id: 'prod-10-gold-80', name: '10 inch Gold Plate 80 GSM', type: 'PLATE', sizeInches: 10, gsm: 80, color: 'Gold', unitLabel: 'packet', defaultRate: 95 },
        { id: 'prod-12-silver-80', name: '12 inch Silver Plate 80 GSM', type: 'PLATE', sizeInches: 12, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 110 },
        { id: 'prod-14-silver-80', name: '14 inch Silver Plate 80 GSM', type: 'PLATE', sizeInches: 14, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 130 },
        { id: 'prod-10-green-80', name: '10 inch Green Plate 80 GSM', type: 'PLATE', sizeInches: 10, gsm: 80, color: 'Green', unitLabel: 'packet', defaultRate: 92 },
        { id: 'prod-10-printed-100', name: '10 inch Printed Plate 100 GSM', type: 'PLATE', sizeInches: 10, gsm: 100, color: 'Printed', unitLabel: 'packet', defaultRate: 120 },
        { id: 'prod-8-silver-80', name: '8 inch Silver Bowl 80 GSM', type: 'PLATE', sizeInches: 8, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 75 },
        { id: 'prod-sheet-700-70', name: 'Sheet 700mm 70 GSM', type: 'SHEET', sizeInches: null, gsm: 70, color: null, unitLabel: 'kg', defaultRate: 32.5 },
        { id: 'prod-sheet-700-80', name: 'Sheet 700mm 80 GSM', type: 'SHEET', sizeInches: null, gsm: 80, color: null, unitLabel: 'kg', defaultRate: 35 },
    ] as const

    for (const p of productsData) {
        await prisma.product.create({ data: { ...p, isActive: true } })
    }

    // --- 4. Inventory ---
    const inventoryData = [
        { id: 'inv-brown-700-70', name: 'Brown Paper 700mm 70 GSM', category: 'Brown Paper', unit: 'kg' },
        { id: 'inv-brown-700-80', name: 'Brown Paper 700mm 80 GSM', category: 'Brown Paper', unit: 'kg' },
        { id: 'inv-silver-film', name: 'Silver Film', category: 'Films', unit: 'kg' },
        { id: 'inv-gold-film', name: 'Gold Film', category: 'Films', unit: 'kg' },
        { id: 'inv-printed-film', name: 'Printed Film', category: 'Films', unit: 'kg' },
        { id: 'inv-gum-bags', name: 'Gum Bags', category: 'Gum Bags', unit: 'piece' },
        { id: 'inv-pp-covers', name: 'PP Covers', category: 'Covers', unit: 'piece' },
        { id: 'inv-packing-rolls', name: 'Packing Rolls', category: 'Packing', unit: 'roll' },
    ]

    for (const item of inventoryData) {
        await prisma.inventoryItem.create({ data: { ...item, currentStock: randomInt(50, 500), isActive: true } })
    }

    // --- 5. Customers (15 realistic customers) ---
    const customerNames = [
        "Annapurna Catering Services", "Sri Lakshmi Tiffins", "Green Leaf Banquets", "Sai Mess & Caterers",
        "Nandini Fast Foods", "Urban Bite Corner", "Bhavani Eats", "Durga Foods",
        "Raju Gari Biryani", "Hyderabad House", "Coastal Spice Catering", "Andhra Meals",
        "Balaji Sweets", "Guntur Mirchi Yard Canteen", "Vijayawada Kitchen"
    ]
    const cities = ['Vijayawada', 'Guntur', 'Hyderabad', 'Tenali', 'Nellore', 'Vizag', 'Ongole', 'Eluru']
    
    const createdCustomers = []
    let p = 9000000000

    for (let i = 0; i < 15; i++) {
        p += 123456
        const c = await prisma.customer.create({
            data: {
                id: `cust-${i + 1}`,
                name: customerNames[i],
                businessName: customerNames[i].includes(' ') ? `${customerNames[i]} Pvt Ltd` : null,
                city: randomItem(cities),
                address: `Shop No ${randomInt(1, 100)}, Main Road`,
                defaultDiscount: randomItem([0, 0, 0, 2, 5]),
                notes: `Seeded account for 6-month simulation.`,
                contacts: {
                    create: [
                        { name: `Contact ${i + 1}`, phone: p.toString(), role: 'Manager', isPrimary: true },
                    ],
                },
            },
        })
        createdCustomers.push(c)
    }

    // --- 6. Invoices (approx 60 invoices over 6 months: Oct 2025 to Mar 2026) ---
    const createdInvoices = []
    const dates: Date[] = []
    
    // Generate dates so they are somewhat spread out chronologically
    for (let i = 0; i < 60; i++) {
        dates.push(randomDate('2025-10-01T08:00:00.000Z', '2026-03-25T18:00:00.000Z'))
    }
    dates.sort((a, b) => a.getTime() - b.getTime())

    for (let i = 0; i < dates.length; i++) {
        const invDate = dates[i]
        const customer = randomItem(createdCustomers)
        const user = randomItem(users)
        
        // Items
        const numItems = randomInt(1, 4)
        const items = []
        let subtotal = 0
        
        for (let j = 0; j < numItems; j++) {
            const prod = randomItem(productsData)
            const qty = randomInt(5, 50)
            const rate = prod.defaultRate
            const amt = qty * rate
            subtotal += amt
            
            items.push({
                productId: prod.id,
                description: prod.name,
                quantity: qty,
                unit: prod.unitLabel,
                rate: rate,
                amount: amt,
                sortOrder: j
            })
        }
        
        const totalAmount = subtotal
        
        const inv = await prisma.invoice.create({
            data: {
                invoiceNumber: `KGD-${invDate.getFullYear()}-${(invDate.getMonth() + 1).toString().padStart(2, '0')}${String(i+1).padStart(3, '0')}`,
                customerId: customer.id,
                invoiceDate: invDate,
                dueDate: addDays(invDate, 15),
                subtotal: subtotal,
                discountAmount: 0,
                totalAmount: totalAmount,
                paidAmount: 0, // We will update this during payment generation
                balanceDue: totalAmount,
                status: 'UNPAID',
                createdById: user.id,
                items: {
                    create: items
                }
            }
        })
        createdInvoices.push({ ...inv, _currentBalance: totalAmount })
    }

    // --- 7. Payments & Allocations (approx 120 payments) ---
    // We iterate chronologically to pay off invoices.
    
    // Shuffle the invoices to create scattered payments
    const payments = []
    
    for(let i=0; i < 120; i++) {
        // Find an invoice that needs paying
        const unpaidInv = createdInvoices.find(inv => inv._currentBalance > 0)
        if (!unpaidInv) break // All invoices paid!

        const paymentDate = addDays(new Date(unpaidInv.invoiceDate), randomInt(1, 20))
        
        // Occasionally partial payment, mostly full payment
        const isPartial = Math.random() > 0.7
        const payAmt = isPartial ? Math.floor(unpaidInv._currentBalance / 2) : unpaidInv._currentBalance

        const payment = await prisma.payment.create({
            data: {
                customerId: unpaidInv.customerId,
                amount: payAmt,
                paymentDate: paymentDate,
                method: randomItem(['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE']),
                reference: `REF-${Math.floor(Math.random()*100000)}`,
                createdById: randomItem(users).id,
            }
        })
        payments.push(payment)

        // Allocate
        await prisma.paymentAllocation.create({
            data: {
                paymentId: payment.id,
                invoiceId: unpaidInv.id,
                amount: payAmt
            }
        })
        
        unpaidInv._currentBalance -= payAmt
        
        const newPaid = Number(unpaidInv.paidAmount) + payAmt
        const newBalance = unpaidInv._currentBalance
        
        // Update local object forcefully for next iteration
        unpaidInv.paidAmount = newPaid as any
        unpaidInv.balanceDue = newBalance as any
        
        let newStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID'
        if (newBalance === 0) newStatus = 'PAID'
        else if (newPaid > 0) newStatus = 'PARTIAL'

        await prisma.invoice.update({
            where: { id: unpaidInv.id },
            data: {
                paidAmount: newPaid,
                balanceDue: newBalance,
                status: newStatus
            }
        })
    }

    // Add some standalone unused payments (cash advances / extra credit)
    for(let i=0; i < 10; i++) {
        const c = randomItem(createdCustomers)
        await prisma.payment.create({
            data: {
                customerId: c.id,
                amount: randomInt(1, 10) * 1000,
                paymentDate: randomDate('2025-10-01T08:00:00.000Z', '2026-03-25T18:00:00.000Z'),
                method: 'CASH',
                createdById: staff.id,
            }
        })
    }

    // Calculate customer creditBalance just in case
    for (const c of createdCustomers) {
        const allPayments = await prisma.payment.findMany({
            where: { customerId: c.id },
            include: { allocations: true }
        })
        
        let credit = 0;
        for (const p of allPayments) {
            const allocated = p.allocations.reduce((sum, a) => sum + Number(a.amount), 0)
            credit += (Number(p.amount) - allocated)
        }

        if (credit > 0) {
            await prisma.customer.update({
                where: { id: c.id },
                data: { creditBalance: credit }
            })
        }
    }

    console.log('Seed complete!')
    console.log('--- Summary ---')
    console.log(`Users: 2 (Admin & Staff)`)
    console.log(`Products: ${productsData.length}`)
    console.log(`Inventory Items: ${inventoryData.length}`)
    console.log(`Customers: ${createdCustomers.length}`)
    console.log(`Invoices: ${createdInvoices.length}`)
    console.log(`Payments: ${payments.length + 10}`)
    console.log('----------------')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
