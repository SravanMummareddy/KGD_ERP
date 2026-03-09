import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, invoiceStatusInfo, paymentMethodLabel } from '@/lib/utils'

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    // ─ Aggregate stats ────────────────────────────────────────────────
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const month = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
        totalOutstandingResult,
        todaySalesResult,
        monthSalesResult,
        activeCustomerCount,
        unpaidInvoiceCount,
        recentInvoices,
        recentPayments,
        topDebtors,
    ] = await Promise.all([
        // Total outstanding across all customers
        prisma.invoice.aggregate({
            where: { status: { in: ['UNPAID', 'PARTIAL'] } },
            _sum: { balanceDue: true },
        }),
        // Today's invoice totals
        prisma.invoice.aggregate({
            where: { invoiceDate: { gte: today }, status: { not: 'CANCELLED' } },
            _sum: { totalAmount: true },
            _count: true,
        }),
        // This month's invoice totals
        prisma.invoice.aggregate({
            where: { invoiceDate: { gte: month }, status: { not: 'CANCELLED' } },
            _sum: { totalAmount: true },
            _count: true,
        }),
        // Active customers
        prisma.customer.count({ where: { isActive: true } }),
        // Unpaid invoices
        prisma.invoice.count({ where: { status: { in: ['UNPAID', 'PARTIAL'] } } }),
        // 5 most recent invoices
        prisma.invoice.findMany({
            include: { customer: true },
            orderBy: { invoiceDate: 'desc' },
            take: 8,
        }),
        // 5 most recent payments
        prisma.payment.findMany({
            include: { customer: true },
            orderBy: { paymentDate: 'desc' },
            take: 5,
        }),
        // Customers with highest outstanding balances
        prisma.invoice.groupBy({
            by: ['customerId'],
            where: { status: { in: ['UNPAID', 'PARTIAL'] } },
            _sum: { balanceDue: true },
            orderBy: { _sum: { balanceDue: 'desc' } },
            take: 8,
        }),
    ])

    // Resolve customer names for top debtors
    const customerIds = topDebtors.map((d) => d.customerId)
    const customerNames = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true },
    })
    const nameMap = new Map(customerNames.map((c) => [c.id, c.name]))

    const totalOutstanding = Number(totalOutstandingResult._sum.balanceDue ?? 0)

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="text-muted">
                        Welcome back, {session.user.name} · {formatDate(now)}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
                    <Link href="/payments/new" className="btn btn-secondary">Record Payment</Link>
                </div>
            </div>

            {/* ─── Stat cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
                    <div className="stat-label">Total Outstanding</div>
                    <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalOutstanding)}</div>
                    <div className="stat-sub">{unpaidInvoiceCount} open invoices</div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                    <div className="stat-label">Today's Sales</div>
                    <div className="stat-value">{formatCurrency(todaySalesResult._sum.totalAmount ?? 0)}</div>
                    <div className="stat-sub">{todaySalesResult._count} invoice(s)</div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                    <div className="stat-label">This Month</div>
                    <div className="stat-value">{formatCurrency(monthSalesResult._sum.totalAmount ?? 0)}</div>
                    <div className="stat-sub">{monthSalesResult._count} invoice(s)</div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                    <div className="stat-label">Active Customers</div>
                    <div className="stat-value">{activeCustomerCount}</div>
                    <div className="stat-sub">
                        <Link href="/customers/new" style={{ color: 'var(--color-primary)', fontSize: '0.8rem' }}>+ Add new</Link>
                    </div>
                </div>
            </div>

            {/* ─── Main content grid ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Recent Invoices */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Invoices</h2>
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
                                {recentInvoices.map((inv) => {
                                    const info = invoiceStatusInfo(inv.status)
                                    return (
                                        <tr key={inv.id}>
                                            <td>
                                                <Link href={`/invoices/${inv.id}`} style={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--color-primary)', textDecoration: 'none' }}>
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

                {/* Outstanding Balances */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Outstanding Balances</h2>
                        <Link href="/customers" className="btn btn-secondary btn-sm">All Customers</Link>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th style={{ textAlign: 'right' }}>Balance Due</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topDebtors.length === 0 && (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-success)', padding: '1.5rem' }}>
                                            🎉 All balances settled!
                                        </td>
                                    </tr>
                                )}
                                {topDebtors.map((d) => (
                                    <tr key={d.customerId}>
                                        <td style={{ fontWeight: 500 }}>
                                            <Link href={`/customers/${d.customerId}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                                                {nameMap.get(d.customerId) ?? 'Unknown'}
                                            </Link>
                                        </td>
                                        <td style={{ textAlign: 'right' }} className="text-money text-danger">
                                            {formatCurrency(d._sum.balanceDue ?? 0)}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Payments</h2>
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
                                    {recentPayments.map((pay) => (
                                        <tr key={pay.id}>
                                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>{formatDate(pay.paymentDate)}</td>
                                            <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{pay.customer.name}</td>
                                            <td><span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{paymentMethodLabel(pay.method)}</span></td>
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
        </>
    )
}
