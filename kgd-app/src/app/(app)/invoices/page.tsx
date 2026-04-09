import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, invoiceStatusInfo } from '@/lib/utils'
import { Suspense } from 'react'
import ColumnFilter from '@/components/layout/ColumnFilter'
import DateDropdownFilter from '@/components/layout/DateDropdownFilter'
import Pagination from '@/components/ui/Pagination'
import SearchInput from '@/components/ui/SearchInput'

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
    searchParams: Promise<{ range?: string; from?: string; to?: string; status?: string | string[]; customer?: string | string[]; page?: string; q?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const sp = await searchParams
    const dateFilter = getDateRange(sp.range ?? null, sp.from ?? null, sp.to ?? null)
    const q = sp.q?.trim() ?? ''

    const statusFilter = sp.status
        ? (Array.isArray(sp.status) ? sp.status : [sp.status])
        : []
    const customerFilter = sp.customer
        ? (Array.isArray(sp.customer) ? sp.customer : [sp.customer])
        : []

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

    const searchFilter = q ? {
        OR: [
            { invoiceNumber: { contains: q, mode: 'insensitive' as const } },
            { customer: { name: { contains: q, mode: 'insensitive' as const } } },
            { customer: { businessName: { contains: q, mode: 'insensitive' as const } } },
        ],
    } : {}

    const whereClause = {
        ...(dateFilter ? { invoiceDate: dateFilter } : {}),
        ...(statusFilter.length > 0 ? { status: { in: statusFilter as ('UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED')[] } } : {}),
        ...(customerFilter.length > 0 ? { customerId: { in: customerFilter } } : {}),
        ...searchFilter,
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
    const hasActiveFilter = statusFilter.length > 0 || customerFilter.length > 0 || currentRange || currentFrom || q

    return (
        <div className="page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Invoices</h1>
                    <p className="page-subtitle">{totalInvoices} invoices total</p>
                </div>
                <Link href="/invoices/new" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.9rem', height: '0.9rem' }}>
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Invoice
                </Link>
            </div>

            {/* Filter toolbar */}
            <div className="filter-toolbar">
                <Suspense>
                    <SearchInput placeholder="Search invoice #, customer…" />
                </Suspense>
                <Suspense>
                    <DateDropdownFilter />
                </Suspense>
                {hasActiveFilter && (
                    <Link href="/invoices" className="clear-filter-link">
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
                            <th style={{ width: '80px' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={9}>
                                    <div className="empty-state">
                                        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                        <p className="empty-state-title">No invoices found</p>
                                        <p className="empty-state-desc">
                                            {hasActiveFilter ? 'No invoices match your current filters.' : 'Create your first invoice to get started.'}
                                        </p>
                                        {hasActiveFilter
                                            ? <Link href="/invoices" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>Clear Filters</Link>
                                            : <Link href="/invoices/new" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>New Invoice</Link>
                                        }
                                    </div>
                                </td>
                            </tr>
                        )}
                        {invoices.map((inv: typeof invoices[number], i: number) => {
                            const info = invoiceStatusInfo(inv.status)
                            const serialNumber = (currentPage - 1) * ITEMS_PER_PAGE + i + 1
                            return (
                                <tr key={inv.id}>
                                    <td className="text-muted text-xs">{serialNumber}</td>
                                    <td>
                                        <Link href={`/invoices/${inv.id}`} style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                                            {inv.invoiceNumber}
                                        </Link>
                                    </td>
                                    <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{formatDate(inv.invoiceDate)}</td>
                                    <td>
                                        <Link href={`/customers/${inv.customerId}`} style={{ color: 'var(--color-text)', textDecoration: 'none', fontWeight: 500 }}>
                                            {inv.customer.businessName || inv.customer.name}
                                        </Link>
                                        {inv.customer.businessName && (
                                            <div className="text-muted text-xs">{inv.customer.name}</div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }} className="text-money">{formatCurrency(inv.totalAmount)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--color-success)' }} className="text-money">
                                        {Number(inv.paidAmount) > 0 ? formatCurrency(inv.paidAmount) : <span className="text-muted">—</span>}
                                    </td>
                                    <td style={{ textAlign: 'right' }} className="text-money">
                                        {Number(inv.balanceDue) > 0
                                            ? <span className="text-danger">{formatCurrency(inv.balanceDue)}</span>
                                            : <span className="text-muted">—</span>}
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
        </div>
    )
}
