import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, paymentMethodLabel } from '@/lib/utils'

export default async function PaymentsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const payments = await prisma.payment.findMany({
        include: { customer: true, allocations: { include: { invoice: true } } },
        orderBy: { paymentDate: 'desc' },
        take: 100,
    })

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payments</h1>
                    <p className="text-muted">{payments.length} recent payments</p>
                </div>
                <Link href="/payments/new" className="btn btn-primary">+ Record Payment</Link>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Method</th>
                            <th>Reference</th>
                            <th>Applied To</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No payments yet.
                                </td>
                            </tr>
                        )}
                        {payments.map((pay) => (
                            <tr key={pay.id}>
                                <td className="text-muted">{formatDate(pay.paymentDate)}</td>
                                <td>
                                    <Link href={`/customers/${pay.customerId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                                        {pay.customer.name}
                                    </Link>
                                </td>
                                <td>
                                    <span className="badge badge-blue">{paymentMethodLabel(pay.method)}</span>
                                </td>
                                <td className="text-muted">{pay.reference || '—'}</td>
                                <td style={{ fontSize: '0.8rem' }}>
                                    {pay.allocations.length === 0
                                        ? <span className="text-muted">Unallocated</span>
                                        : pay.allocations.map((a) => (
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}
