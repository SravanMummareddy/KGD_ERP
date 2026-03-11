import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, invoiceStatusInfo } from '@/lib/utils'
import DateRangeFilter from '@/components/layout/DateRangeFilter'
import { Suspense } from 'react'

function getDateRange(range: string|null, from: string|null, to: string|null) {
    const now = new Date()
    if (range === 'custom' && from && to) {
        return { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
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
    searchParams: Promise<{ range?: string; from?: string; to?: string; status?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const sp = await searchParams
    const dateFilter = getDateRange(sp.range ?? null, sp.from ?? null, sp.to ?? null)

    const invoices = await prisma.invoice.findMany({
        include: { customer: true },
        where: {
            ...(dateFilter ? { invoiceDate: dateFilter } : {}),
            ...(sp.status ? { status: sp.status as 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED' } : {}),
        },
        orderBy: { invoiceDate: 'desc' },
        take: 200,
    })

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Invoices</h1>
                    <p className="text-muted">{invoices.length} invoices shown</p>
                </div>
                <Link href="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <Suspense>
                    <DateRangeFilter />
                </Suspense>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                    {(['', 'UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'] as const).map((s) => {
                        const labels: Record<string, string> = { '': 'All', UNPAID: 'Unpaid', PARTIAL: 'Partial', PAID: 'Paid', CANCELLED: 'Cancelled' }
                        const current = sp.status ?? ''
                        const active = s === current
                        return (
                            <Link key={s} href={s ? `/invoices?status=${s}` : '/invoices'}
                                style={{
                                    padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 500,
                                    borderRadius: '0.375rem', border: '1px solid var(--color-border)',
                                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                                    color: active ? 'white' : 'var(--color-text)', textDecoration: 'none',
                                }}>
                                {labels[s]}
                            </Link>
                        )
                    })}
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th style={{ textAlign: 'right' }}>Paid</th>
                            <th style={{ textAlign: 'right' }}>Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No invoices found for this filter. <Link href="/invoices/new">Create one →</Link>
                                </td>
                            </tr>
                        )}
                        {invoices.map((inv: typeof invoices[number]) => {
                            const info = invoiceStatusInfo(inv.status)
                            return (
                                <tr key={inv.id}>
                                    <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {inv.invoiceNumber}
                                    </td>
                                    <td className="text-muted">{formatDate(inv.invoiceDate)}</td>
                                    <td>
                                        <Link href={`/customers/${inv.customerId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
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
        </>
    )
}
