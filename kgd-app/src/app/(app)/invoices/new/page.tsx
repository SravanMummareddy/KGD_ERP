import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export default async function NewInvoicePage({
    searchParams,
}: {
    searchParams: { customerId?: string }
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

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

    return (
        <InvoiceForm
            customers={customers.map((c) => ({ id: c.id, name: c.name, businessName: c.businessName }))}
            products={products.map((p) => ({
                id: p.id,
                name: p.name,
                type: p.type,
                unitLabel: p.unitLabel,
                defaultRate: p.defaultRate ? Number(p.defaultRate) : undefined,
            }))}
            defaultCustomerId={searchParams.customerId}
        />
    )
}
