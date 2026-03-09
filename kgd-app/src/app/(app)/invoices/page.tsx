import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, invoiceStatusInfo } from '@/lib/utils'

export default async function InvoicesPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const invoices = await prisma.invoice.findMany({
        include: { customer: true },
        orderBy: { invoiceDate: 'desc' },
        take: 100,
    })

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Invoices</h1>
                    <p className="text-muted">{invoices.length} total invoices</p>
                </div>
                <Link href="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
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
                                    No invoices yet. <Link href="/invoices/new">Create your first invoice →</Link>
                                </td>
                            </tr>
                        )}
                        {invoices.map((inv) => {
                            const info = invoiceStatusInfo(inv.status)
                            return (
                                <tr key={inv.id}>
                                    <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {inv.invoiceNumber}
                                    </td>
                                    <td className="text-muted">{formatDate(inv.invoiceDate)}</td>
                                    <td>
                                        <Link href={`/customers/${inv.customerId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                                            {inv.customer.name}
                                        </Link>
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
