import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, paymentMethodLabel } from '@/lib/utils'
import { Suspense } from 'react'
import ColumnFilter from '@/components/layout/ColumnFilter'
import DateDropdownFilter from '@/components/layout/DateDropdownFilter'
import Pagination from '@/components/ui/Pagination'
import SearchInput from '@/components/ui/SearchInput'

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
    searchParams: Promise<{ range?: string; from?: string; to?: string; method?: string | string[]; customer?: string | string[]; page?: string; q?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const sp = await searchParams
    const dateFilter = getDateRange(sp.range ?? null, sp.from ?? null, sp.to ?? null)
    const q = sp.q?.trim() ?? ''

    const methodFilter = sp.method
        ? (Array.isArray(sp.method) ? sp.method : [sp.method])
        : []
    const customerFilter = sp.customer
        ? (Array.isArray(sp.customer) ? sp.customer : [sp.customer])
        : []

    type PaymentRow = Awaited<ReturnType<typeof prisma.payment.findMany>>[number]

    const allCustomers = await prisma.customer.findMany({
        where: { isActive: true },
        select: { id: true, name: true, businessName: true },
        orderBy: { name: 'asc' },
    })

    const currentPage = Number(sp.page) || 1
    const ITEMS_PER_PAGE = 10

    const searchFilter = q ? {
        OR: [
            { customer: { name: { contains: q, mode: 'insensitive' as const } } },
            { customer: { businessName: { contains: q, mode: 'insensitive' as const } } },
            { reference: { contains: q, mode: 'insensitive' as const } },
        ],
    } : {}

    const whereClause = {
        ...(dateFilter ? { paymentDate: dateFilter } : {}),
        ...(methodFilter.length > 0 ? { method: { in: methodFilter as ('CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER')[] } } : {}),
        ...(customerFilter.length > 0 ? { customerId: { in: customerFilter } } : {}),
        ...searchFilter,
    }

    const totalPayments = await prisma.payment.count({ where: whereClause })
    const totalPages = Math.ceil(totalPayments / ITEMS_PER_PAGE)

    const payments = await prisma.payment.findMany({
        include: { customer: true, allocations: { include: { invoice: true } } },
        where: whereClause,
        orderBy: { paymentDate: 'desc' },
        take: ITEMS_PER_PAGE,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
    })

    const customerOptions = allCustomers.map((c: typeof allCustomers[number]) => ({
        value: c.id,
        label: c.businessName || c.name,
    }))

    const hasActiveFilter = methodFilter.length > 0 || customerFilter.length > 0 || sp.from || sp.range || q

    return (
        <div className="page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payments</h1>
                    <p className="page-subtitle">{totalPayments} payments total</p>
                </div>
                <Link href="/payments/new" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.9rem', height: '0.9rem' }}>
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Record Payment
                </Link>
            </div>

            {/* Filter toolbar */}
            <div className="filter-toolbar">
                <Suspense>
                    <SearchInput placeholder="Search customer, reference…" />
                </Suspense>
                <Suspense>
                    <DateDropdownFilter />
                </Suspense>
                {hasActiveFilter && (
                    <Link href="/payments" className="clear-filter-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.75rem', height: '0.75rem' }}>
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear filters
                    </Link>
                )}
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '44px' }}>#</th>
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
                            <th style={{ width: '80px' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 && (
                            <tr>
                                <td colSpan={8}>
                                    <div className="empty-state">
                                        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                            <line x1="1" y1="10" x2="23" y2="10" />
                                        </svg>
                                        <p className="empty-state-title">No payments found</p>
                                        <p className="empty-state-desc">
                                            {hasActiveFilter ? 'No payments match your current filters.' : 'Record your first payment to get started.'}
                                        </p>
                                        {hasActiveFilter
                                            ? <Link href="/payments" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>Clear Filters</Link>
                                            : <Link href="/payments/new" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>Record Payment</Link>
                                        }
                                    </div>
                                </td>
                            </tr>
                        )}
                        {payments.map((pay: PaymentRow, i: number) => {
                            const serialNumber = (currentPage - 1) * ITEMS_PER_PAGE + i + 1
                            return (
                                <tr key={pay.id}>
                                    <td className="text-muted text-xs">{serialNumber}</td>
                                    <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{formatDate(pay.paymentDate)}</td>
                                    <td>
                                        <Link href={`/customers/${pay.customerId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                                            {pay.customer.businessName || pay.customer.name}
                                        </Link>
                                        {pay.customer.businessName && (
                                            <div className="text-muted text-xs">{pay.customer.name}</div>
                                        )}
                                    </td>
                                    <td>
                                        <span className="badge badge-blue">{paymentMethodLabel(pay.method)}</span>
                                    </td>
                                    <td className="text-muted" style={{ fontSize: '0.82rem' }}>{pay.reference || '—'}</td>
                                    <td style={{ fontSize: '0.82rem' }}>
                                        {pay.allocations.length === 0
                                            ? <span className="badge badge-purple">Advance / Credit</span>
                                            : pay.allocations.map((a: PaymentRow['allocations'][number]) => (
                                                <div key={a.id}>
                                                    <Link href={`/invoices/${a.invoiceId}`} style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
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
                                        <Link href={`/payments/${pay.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>
    )
}
