import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, invoiceStatusInfo, paymentMethodLabel } from '@/lib/utils'
import { getCustomerOutstandingSummaries } from '@/lib/outstanding'

function IconAlertCircle() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
}

function IconTrendingUp() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    )
}

function IconBarChart() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    )
}

function IconUsers() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const month = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
        todaySalesResult,
        monthSalesResult,
        activeCustomerCount,
        unpaidInvoiceCount,
        recentInvoices,
        recentPayments,
        activeCustomers,
    ] = await Promise.all([
        prisma.invoice.aggregate({
            where: { invoiceDate: { gte: today }, status: { not: 'CANCELLED' } },
            _sum: { totalAmount: true },
            _count: true,
        }),
        prisma.invoice.aggregate({
            where: { invoiceDate: { gte: month }, status: { not: 'CANCELLED' } },
            _sum: { totalAmount: true },
            _count: true,
        }),
        prisma.customer.count({ where: { isActive: true } }),
        prisma.invoice.count({ where: { status: { in: ['UNPAID', 'PARTIAL'] } } }),
        prisma.invoice.findMany({
            include: { customer: true },
            orderBy: { invoiceDate: 'desc' },
            take: 8,
        }),
        prisma.payment.findMany({
            include: { customer: true },
            orderBy: { paymentDate: 'desc' },
            take: 5,
        }),
        prisma.customer.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
        }),
    ])

    type InvRow = typeof recentInvoices[number]
    type PayRow = typeof recentPayments[number]

    const outstanding = await getCustomerOutstandingSummaries(activeCustomers.map((c: { id: string }) => c.id))
    const totalOutstanding = outstanding.reduce((sum, o) => sum + o.netOutstanding, 0)
    const topDebtors = outstanding
        .filter((o) => o.netOutstanding > 0)
        .sort((a, b) => b.netOutstanding - a.netOutstanding)
        .slice(0, 8)
    const nameMap = new Map(activeCustomers.map((c: { id: string; name: string }) => [c.id, c.name]))

    return (
        <div className="page-fade-in">
            {/* ─── Page Header ─── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">
                        Welcome back, <strong>{session.user.name}</strong> · {formatDate(now)}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <Link href="/invoices/new" className="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.9rem', height: '0.9rem' }}>
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Invoice
                    </Link>
                    <Link href="/payments/new" className="btn btn-secondary">Record Payment</Link>
                </div>
            </div>

            {/* ─── Stat cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon-box stat-icon-danger">
                        <IconAlertCircle />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">Outstanding</div>
                        <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalOutstanding)}</div>
                        <div className="stat-sub">{unpaidInvoiceCount} open invoices</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-box stat-icon-primary">
                        <IconTrendingUp />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">Today's Sales</div>
                        <div className="stat-value">{formatCurrency(todaySalesResult._sum.totalAmount ?? 0)}</div>
                        <div className="stat-sub">{todaySalesResult._count} invoice{todaySalesResult._count !== 1 ? 's' : ''}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-box stat-icon-success">
                        <IconBarChart />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">This Month</div>
                        <div className="stat-value">{formatCurrency(monthSalesResult._sum.totalAmount ?? 0)}</div>
                        <div className="stat-sub">{monthSalesResult._count} invoice{monthSalesResult._count !== 1 ? 's' : ''}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-box stat-icon-purple">
                        <IconUsers />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">Active Customers</div>
                        <div className="stat-value">{activeCustomerCount}</div>
                        <div className="stat-sub">
                            <Link href="/customers/new" style={{ color: 'var(--color-primary)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}>
                                + Add new
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Main content grid ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Recent Invoices */}
                <div>
                    <div className="section-header">
                        <h2 className="section-title">Recent Invoices</h2>
                        <Link href="/invoices" className="btn btn-secondary btn-sm">View All</Link>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Customer</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan={4}>
                                            <div className="empty-state" style={{ padding: '2rem' }}>
                                                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                                <p className="empty-state-desc">No invoices yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {recentInvoices.map((inv: InvRow) => {
                                    const info = invoiceStatusInfo(inv.status)
                                    return (
                                        <tr key={inv.id}>
                                            <td>
                                                <Link href={`/invoices/${inv.id}`} style={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                    {inv.invoiceNumber}
                                                </Link>
                                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>{formatDate(inv.invoiceDate)}</div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{inv.customer.name}</td>
                                            <td style={{ textAlign: 'right' }} className="text-money">{formatCurrency(inv.totalAmount)}</td>
                                            <td><span className={`badge ${info.color}`}>{info.label}</span></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right column */}
                <div>
                    {/* Outstanding Balances */}
                    <div className="section-header">
                        <h2 className="section-title">Outstanding Balances</h2>
                        <Link href="/customers" className="btn btn-secondary btn-sm">All Customers</Link>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th style={{ textAlign: 'right' }}>Balance Due</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topDebtors.length === 0 && (
                                    <tr>
                                        <td colSpan={3}>
                                            <div className="empty-state" style={{ padding: '2rem' }}>
                                                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                                <p className="empty-state-desc" style={{ color: 'var(--color-success)' }}>All balances settled!</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {topDebtors.map((d) => (
                                    <tr key={d.customerId}>
                                        <td style={{ fontWeight: 500 }}>
                                            <Link href={`/customers/${d.customerId}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                                                {String(nameMap.get(d.customerId) ?? 'Unknown')}
                                            </Link>
                                        </td>
                                        <td style={{ textAlign: 'right' }} className="text-money text-danger">
                                            {formatCurrency(d.netOutstanding)}
                                        </td>
                                        <td>
                                            <Link href={`/payments/new?customerId=${d.customerId}`} className="btn btn-secondary btn-sm">
                                                Pay
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Recent Payments */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <div className="section-header">
                            <h2 className="section-title">Recent Payments</h2>
                            <Link href="/payments" className="btn btn-secondary btn-sm">View All</Link>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Method</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPayments.length === 0 && (
                                        <tr>
                                            <td colSpan={4}>
                                                <div className="empty-state" style={{ padding: '1.5rem' }}>
                                                    <p className="empty-state-desc">No payments recorded yet</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {recentPayments.map((pay: PayRow) => (
                                        <tr key={pay.id}>
                                            <td className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(pay.paymentDate)}</td>
                                            <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{pay.customer.name}</td>
                                            <td><span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{paymentMethodLabel(pay.method)}</span></td>
                                            <td style={{ textAlign: 'right', color: 'var(--color-success)' }} className="text-money">
                                                {formatCurrency(pay.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
