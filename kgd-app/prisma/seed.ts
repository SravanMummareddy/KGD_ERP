import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create admin user — change password before production!
    const adminHash = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@kgd.local' },
        update: {},
        create: {
            name: 'Admin',
            email: 'admin@kgd.local',
            passwordHash: adminHash,
            role: 'ADMIN',
        },
    })
    console.log('✅ Admin user:', admin.email)

    // Create a staff user
    const staffHash = await bcrypt.hash('staff123', 12)
    const staff = await prisma.user.upsert({
        where: { email: 'staff@kgd.local' },
        update: {},
        create: {
            name: 'Staff User',
            email: 'staff@kgd.local',
            passwordHash: staffHash,
            role: 'STAFF',
        },
    })
    console.log('✅ Staff user:', staff.email)

    // Seed sample products
    const products = [
        { name: '10 inch Silver Plate 80 GSM', type: 'PLATE' as const, sizeInches: 10, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 90 },
        { name: '10 inch Gold Plate 80 GSM', type: 'PLATE' as const, sizeInches: 10, gsm: 80, color: 'Gold', unitLabel: 'packet', defaultRate: 95 },
        { name: '12 inch Silver Plate 80 GSM', type: 'PLATE' as const, sizeInches: 12, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 110 },
        { name: '14 inch Silver Plate 80 GSM', type: 'PLATE' as const, sizeInches: 14, gsm: 80, color: 'Silver', unitLabel: 'packet', defaultRate: 130 },
        { name: '10 inch Green Plate 80 GSM', type: 'PLATE' as const, sizeInches: 10, gsm: 80, color: 'Green', unitLabel: 'packet', defaultRate: 90 },
        { name: 'Sheet 700mm 70 GSM', type: 'SHEET' as const, sizeInches: null, gsm: 70, color: null, unitLabel: 'kg', defaultRate: 32.5 },
        { name: 'Sheet 700mm 80 GSM', type: 'SHEET' as const, sizeInches: null, gsm: 80, color: null, unitLabel: 'kg', defaultRate: 35 },
        { name: 'Sheet 640mm 120 GSM', type: 'SHEET' as const, sizeInches: null, gsm: 120, color: null, unitLabel: 'kg', defaultRate: 40 },
    ]

    for (const p of products) {
        await prisma.product.upsert({
            where: { id: `seed-${p.name.toLowerCase().replace(/\s+/g, '-')}` },
            update: {},
            create: {
                id: `seed-${p.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: p.name,
                type: p.type,
                sizeInches: p.sizeInches,
                gsm: p.gsm,
                color: p.color,
                unitLabel: p.unitLabel,
                defaultRate: p.defaultRate,
            },
        })
    }
    console.log(`✅ Seeded ${products.length} products`)

    // Seed common inventory items (raw materials)
    const inventoryItems = [
        { name: 'Brown Paper 700mm 70 GSM', category: 'Brown Paper', unit: 'kg', currentStock: 0 },
        { name: 'Brown Paper 700mm 80 GSM', category: 'Brown Paper', unit: 'kg', currentStock: 0 },
        { name: 'Brown Paper 640mm 120 GSM', category: 'Brown Paper', unit: 'kg', currentStock: 0 },
        { name: 'Threads', category: 'Threads', unit: 'kg', currentStock: 0 },
        { name: 'Silver Film', category: 'Films', unit: 'kg', currentStock: 0 },
        { name: 'Gold Film', category: 'Films', unit: 'kg', currentStock: 0 },
        { name: 'Gum Bags', category: 'Gum Bags', unit: 'piece', currentStock: 0 },
        { name: 'PP Covers', category: 'Covers', unit: 'piece', currentStock: 0 },
        { name: 'Luggage Covers', category: 'Covers', unit: 'piece', currentStock: 0 },
        { name: 'Packing Strips', category: 'Packing', unit: 'piece', currentStock: 0 },
        { name: 'Packing Rolls', category: 'Packing', unit: 'roll', currentStock: 0 },
    ]

    for (const item of inventoryItems) {
        await prisma.inventoryItem.upsert({
            where: { id: `seed-inv-${item.name.toLowerCase().replace(/\s+/g, '-')}` },
            update: {},
            create: {
                id: `seed-inv-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: item.name,
                category: item.category,
                unit: item.unit,
                currentStock: item.currentStock,
            },
        })
    }
    console.log(`✅ Seeded ${inventoryItems.length} inventory items`)

    console.log('\n🎉 Seed complete!')
    console.log('\nDefault login credentials:')
    console.log('  Admin → admin@kgd.local / admin123')
    console.log('  Staff → staff@kgd.local / staff123')
    console.log('\n⚠️  Change these passwords before using in production!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
