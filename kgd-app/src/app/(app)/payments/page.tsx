import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, paymentMethodLabel } from '@/lib/utils'
import { Suspense } from 'react'
import ColumnFilter from '@/components/layout/ColumnFilter'
import DateDropdownFilter from '@/components/layout/DateDropdownFilter'

function getDateRange(range: string | null, from: string | null, to: string | null) {
    const now = new Date()
    if (from && to) {
        return { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
    }
    if (range === 'month') {
        return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    }
    const days = parseInt(range ?? '0')
    if (!days) return undefined
    const start = new Date(now)
    start.setDate(start.getDate() - days + 1)
    start.setHours(0, 0, 0, 0)
    return { gte: start }
}

const METHOD_OPTIONS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'OTHER', label: 'Other' },
]

export default async function PaymentsPage({
    searchParams,
}: {
    searchParams: Promise<{ range?: string; from?: string; to?: string; method?: string | string[]; customer?: string | string[] }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const sp = await searchParams
    const dateFilter = getDateRange(sp.range ?? null, sp.from ?? null, sp.to ?? null)

    // Normalize multi-value params
    const methodFilter = sp.method
        ? (Array.isArray(sp.method) ? sp.method : [sp.method])
        : []
    const customerFilter = sp.customer
        ? (Array.isArray(sp.customer) ? sp.customer : [sp.customer])
        : []

    type PaymentRow = Awaited<ReturnType<typeof prisma.payment.findMany>>[number]

    // Fetch all customers for the filter dropdown options
    const allCustomers = await prisma.customer.findMany({
        where: { isActive: true },
        select: { id: true, name: true, businessName: true },
        orderBy: { name: 'asc' },
    })

    const payments = await prisma.payment.findMany({
        include: { customer: true, allocations: { include: { invoice: true } } },
        where: {
            ...(dateFilter ? { paymentDate: dateFilter } : {}),
            ...(methodFilter.length > 0 ? { method: { in: methodFilter as ('CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER')[] } } : {}),
            ...(customerFilter.length > 0 ? { customerId: { in: customerFilter } } : {}),
        },
        orderBy: { paymentDate: 'desc' },
        take: 300,
    })

    const customerOptions = allCustomers.map((c: typeof allCustomers[number]) => ({
        value: c.id,
        label: c.businessName || c.name,
    }))

    // Quick date filter buttons
    const currentRange = sp.range ?? ''
    const dateButtons = [
        { label: 'All time', value: '' },
        { label: 'Today', value: '1' },
        { label: '7 days', value: '7' },
        { label: '30 days', value: '30' },
        { label: 'This month', value: 'month' },
    ]

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payments</h1>
                    <p className="text-muted">{payments.length} payments shown</p>
                </div>
                <Link href="/payments/new" className="btn btn-primary">+ Record Payment</Link>
            </div>

            {/* Date dropdown + column filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <Suspense>
                    <DateDropdownFilter />
                </Suspense>
                {(methodFilter.length > 0 || customerFilter.length > 0 || sp.from || sp.range) && (
                    <Link href="/payments" style={{ fontSize: '0.78rem', color: 'var(--color-danger)', textDecoration: 'none' }}>
                        ✕ Clear all
                    </Link>
                )}
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>
                                <Suspense fallback="Customer">
                                    <ColumnFilter column="customer" label="Customer" options={customerOptions} paramKey="customer" />
                                </Suspense>
                            </th>
                            <th>
                                <Suspense fallback="Method">
                                    <ColumnFilter column="method" label="Method" options={METHOD_OPTIONS} paramKey="method" />
                                </Suspense>
                            </th>
                            <th>Reference</th>
                            <th>Applied To</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No payments match this filter.{' '}
                                    <Link href="/payments" style={{ color: 'var(--color-primary)' }}>Clear filters</Link>
                                </td>
                            </tr>
                        )}
                        {payments.map((pay: PaymentRow) => (
                            <tr key={pay.id}>
                                <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDate(pay.paymentDate)}</td>
                                <td>
                                    <Link href={`/customers/${pay.customerId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                                        {pay.customer.businessName || pay.customer.name}
                                    </Link>
                                    {pay.customer.businessName && (
                                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{pay.customer.name}</div>
                                    )}
                                </td>
                                <td>
                                    <span className="badge badge-blue">{paymentMethodLabel(pay.method)}</span>
                                </td>
                                <td className="text-muted">{pay.reference || '—'}</td>
                                <td style={{ fontSize: '0.8rem' }}>
                                    {pay.allocations.length === 0
                                        ? <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Advance / Credit</span>
                                        : pay.allocations.map((a: PaymentRow['allocations'][number]) => (
                                            <div key={a.id}>
                                                <Link href={`/invoices/${a.invoiceId}`} style={{ color: 'var(--color-primary)', fontSize: '0.8rem' }}>
                                                    {a.invoice.invoiceNumber}
                                                </Link>
                                                <span className="text-muted"> ({formatCurrency(a.amount)})</span>
                                            </div>
                                        ))
                                    }
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 700 }} className="text-money">
                                    {formatCurrency(pay.amount)}
                                </td>
                                <td>
                                    <Link href={`/payments/${pay.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}
