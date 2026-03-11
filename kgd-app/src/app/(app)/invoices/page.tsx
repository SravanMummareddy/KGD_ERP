import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, invoiceStatusInfo } from '@/lib/utils'
import { Suspense } from 'react'
import ColumnFilter from '@/components/layout/ColumnFilter'
import DateDropdownFilter from '@/components/layout/DateDropdownFilter'
import Pagination from '@/components/ui/Pagination'

const STATUS_OPTIONS = [
    { value: 'UNPAID', label: 'Unpaid' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'PAID', label: 'Paid' },
    { value: 'CANCELLED', label: 'Cancelled' },
]

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

export default async function InvoicesPage({
    searchParams,
}: {
    searchParams: Promise<{ range?: string; from?: string; to?: string; status?: string | string[]; customer?: string | string[]; page?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const sp = await searchParams
    const dateFilter = getDateRange(sp.range ?? null, sp.from ?? null, sp.to ?? null)

    const statusFilter = sp.status
        ? (Array.isArray(sp.status) ? sp.status : [sp.status])
        : []
    const customerFilter = sp.customer
        ? (Array.isArray(sp.customer) ? sp.customer : [sp.customer])
        : []

    // For filter dropdown options
    const allCustomers = await prisma.customer.findMany({
        where: { isActive: true },
        select: { id: true, name: true, businessName: true },
        orderBy: { name: 'asc' },
    })
    const customerOptions = allCustomers.map((c: typeof allCustomers[number]) => ({
        value: c.id,
        label: c.businessName || c.name,
    }))

    const currentPage = Number(sp.page) || 1
    const ITEMS_PER_PAGE = 10

    const whereClause = {
        ...(dateFilter ? { invoiceDate: dateFilter } : {}),
        ...(statusFilter.length > 0 ? { status: { in: statusFilter as ('UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED')[] } } : {}),
        ...(customerFilter.length > 0 ? { customerId: { in: customerFilter } } : {}),
    }

    const totalInvoices = await prisma.invoice.count({ where: whereClause })
    const totalPages = Math.ceil(totalInvoices / ITEMS_PER_PAGE)

    const invoices = await prisma.invoice.findMany({
        include: { customer: true },
        where: whereClause,
        orderBy: { invoiceDate: 'desc' },
        take: ITEMS_PER_PAGE,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
    })

    const currentRange = sp.range ?? ''
    const currentFrom = sp.from ?? ''
    const currentTo = sp.to ?? ''
    const hasActiveFilter = statusFilter.length > 0 || customerFilter.length > 0 || currentRange || currentFrom

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
                    <h1 className="page-title">Invoices</h1>
                    <p className="text-muted">{totalInvoices} invoices total</p>
                </div>
                <Link href="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
            </div>

            {/* Date + active filter indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <Suspense>
                    <DateDropdownFilter />
                </Suspense>
                {hasActiveFilter && (
                    <Link href="/invoices" style={{ fontSize: '0.78rem', color: 'var(--color-danger)', textDecoration: 'none' }}>✕ Clear all</Link>
                )}
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', color: 'var(--color-muted)' }}>#</th>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>
                                <Suspense fallback="Customer">
                                    <ColumnFilter column="customer" label="Customer" options={customerOptions} paramKey="customer" />
                                </Suspense>
                            </th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th style={{ textAlign: 'right' }}>Paid</th>
                            <th style={{ textAlign: 'right' }}>Balance</th>
                            <th>
                                <Suspense fallback="Status">
                                    <ColumnFilter column="status" label="Status" options={STATUS_OPTIONS} paramKey="status" />
                                </Suspense>
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No invoices match this filter.{' '}
                                    {hasActiveFilter && <Link href="/invoices">Clear filters</Link>}
                                    {!hasActiveFilter && <Link href="/invoices/new">Create one →</Link>}
                                </td>
                            </tr>
                        )}
                        {invoices.map((inv: typeof invoices[number], i: number) => {
                            const info = invoiceStatusInfo(inv.status)
                            const serialNumber = (currentPage - 1) * ITEMS_PER_PAGE + i + 1
                            return (
                                <tr key={inv.id}>
                                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{serialNumber}</td>
                                    <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        <Link href={`/invoices/${inv.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                            {inv.invoiceNumber}
                                        </Link>
                                    </td>
                                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDate(inv.invoiceDate)}</td>
                                    <td>
                                        <Link href={`/customers/${inv.customerId}`} style={{ color: 'var(--color-text)', textDecoration: 'none', fontWeight: 500 }}>
                                            {inv.customer.businessName || inv.customer.name}
                                        </Link>
                                        {inv.customer.businessName && (
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{inv.customer.name}</div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }} className="text-money">{formatCurrency(inv.totalAmount)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--color-success)' }} className="text-money">
                                        {Number(inv.paidAmount) > 0 ? formatCurrency(inv.paidAmount) : '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }} className="text-money">
                                        {Number(inv.balanceDue) > 0
                                            ? <span className="text-danger">{formatCurrency(inv.balanceDue)}</span>
                                            : '—'}
                                    </td>
                                    <td><span className={`badge ${info.color}`}>{info.label}</span></td>
                                    <td>
                                        <Link href={`/invoices/${inv.id}`} className="btn btn-secondary btn-sm">View</Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination totalPages={totalPages} currentPage={currentPage} />
        </>
    )
}
