import { prisma } from '@/lib/prisma'

export type CustomerOutstanding = {
    customerId: string
    invoiceOutstanding: number
    totalPaid: number
    totalAllocated: number
    availableCredit: number
    netOutstanding: number
}

export async function getCustomerOutstandingSummaries(customerIds?: string[]): Promise<CustomerOutstanding[]> {
    const customerFilter = customerIds && customerIds.length > 0 ? { in: customerIds } : undefined

    const [balances, payments] = await Promise.all([
        prisma.invoice.groupBy({
            by: ['customerId'],
            where: {
                status: { in: ['UNPAID', 'PARTIAL'] },
                ...(customerFilter ? { customerId: customerFilter } : {}),
            },
            _sum: { balanceDue: true },
        }),
        prisma.payment.findMany({
            where: customerFilter ? { customerId: customerFilter } : undefined,
            select: {
                customerId: true,
                amount: true,
                allocations: { select: { amount: true } },
            },
        }),
    ])

    const invoiceOutstandingMap = new Map<string, number>(
        balances.map((b) => [b.customerId, Number(b._sum.balanceDue ?? 0)])
    )
    const totalPaidMap = new Map<string, number>()
    const totalAllocatedMap = new Map<string, number>()

    for (const p of payments) {
        totalPaidMap.set(p.customerId, (totalPaidMap.get(p.customerId) ?? 0) + Number(p.amount))
        const allocated = p.allocations.reduce((sum, a) => sum + Number(a.amount), 0)
        totalAllocatedMap.set(p.customerId, (totalAllocatedMap.get(p.customerId) ?? 0) + allocated)
    }

    const ids = customerIds && customerIds.length > 0
        ? customerIds
        : Array.from(new Set([...invoiceOutstandingMap.keys(), ...totalPaidMap.keys()]))

    return ids.map((customerId) => {
        const invoiceOutstanding = invoiceOutstandingMap.get(customerId) ?? 0
        const totalPaid = totalPaidMap.get(customerId) ?? 0
        const totalAllocated = totalAllocatedMap.get(customerId) ?? 0
        const availableCredit = Math.max(0, totalPaid - totalAllocated)
        const netOutstanding = invoiceOutstanding - availableCredit

        return {
            customerId,
            invoiceOutstanding,
            totalPaid,
            totalAllocated,
            availableCredit,
            netOutstanding,
        }
    })
}

