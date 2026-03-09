import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export default async function NewInvoicePage({
    searchParams,
}: {
    searchParams: Promise<{ customerId?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const { customerId: defaultCustomerId } = await searchParams

    const [customers, products] = await Promise.all([
        prisma.customer.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        }),
        prisma.product.findMany({
            where: { isActive: true },
            orderBy: [{ type: 'asc' }, { name: 'asc' }],
        }),
    ])

    type CustomerRow = typeof customers[number]
    type ProductRow = typeof products[number]

    return (
        <InvoiceForm
            customers={customers.map((c: CustomerRow) => ({ id: c.id, name: c.name, businessName: c.businessName }))}
            products={products.map((p: ProductRow) => ({
                id: p.id,
                name: p.name,
                type: p.type,
                unitLabel: p.unitLabel,
                defaultRate: p.defaultRate ? Number(p.defaultRate) : undefined,
            }))}
            defaultCustomerId={defaultCustomerId}
        />
    )
}
