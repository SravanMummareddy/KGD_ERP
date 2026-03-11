import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, formatDateTime, invoiceStatusInfo, paymentMethodLabel } from '@/lib/utils'
import CancelInvoiceButton from '@/components/invoices/CancelInvoiceButton'
import { getCustomerOutstandingSummaries } from '@/lib/outstanding'

export default async function InvoiceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await auth()
    if (!session?.user) redirect('/login')

    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            customer: { include: { contacts: { where: { isPrimary: true }, take: 1 } } },
            items: { orderBy: { sortOrder: 'asc' } },
            allocations: {
                include: { payment: true },
                orderBy: { payment: { paymentDate: 'asc' } },
            },
            createdBy: true,
        },
    })

    if (!invoice) notFound()

    type ItemRow = typeof invoice.items[number]
    type AllocRow = typeof invoice.allocations[number]

    const info = invoiceStatusInfo(invoice.status)
    const primaryContact = invoice.customer.contacts[0]

    const outstanding = await getCustomerOutstandingSummaries([invoice.customerId])
    const customerNetOutstanding = outstanding[0]?.netOutstanding ?? 0

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">{invoice.invoiceNumber}</h1>
                    <p className="text-muted">
                        <Link href={`/customers/${invoice.customerId}`} style={{ color: 'var(--color-primary)' }}>
                            {invoice.customer.name}
                        </Link>
                        {invoice.customer.businessName && ` · ${invoice.customer.businessName}`}
                        {invoice.customer.city && ` · ${invoice.customer.city}`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link href="/invoices" className="btn btn-secondary btn-sm">← Invoices</Link>
                    <span className={`badge ${info.color}`} style={{ padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}>{info.label}</span>
                    <Link href={`/print/invoices/${invoice.id}`} target="_blank" className="btn btn-secondary">
                        🖨 Print
                    </Link>
                    {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                        <Link href={`/payments/new?invoiceId=${invoice.id}&customerId=${invoice.customerId}`} className="btn btn-primary">
                            Record Payment
                        </Link>
                    )}
                    {session.user.role === 'ADMIN' && invoice.status !== 'CANCELLED' && (
                        <CancelInvoiceButton invoiceId={invoice.id} />
                    )}
                </div>
            </div>

            {/* Status bar */}
            {Number(invoice.balanceDue) > 0 && (
                <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⚠️ Outstanding balance: <strong>{formatCurrency(invoice.balanceDue)}</strong></span>
                    <Link href={`/payments/new?invoiceId=${invoice.id}&customerId=${invoice.customerId}`} className="btn btn-primary btn-sm">
                        Record Payment →
                    </Link>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Left: Items + Totals */}
                <div>
                    <div className="card">
                        {/* Invoice meta */}
                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem' }}>
                            <div>
                                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Invoice Date</div>
                                <div style={{ fontWeight: 600 }}>{formatDate(invoice.invoiceDate)}</div>
                            </div>
                            {invoice.dueDate && (
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Due Date</div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{formatDate(invoice.dueDate)}</div>
                                </div>
                            )}
                            <div>
                                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Created By</div>
                                <div style={{ fontWeight: 500 }}>{invoice.createdBy.name}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer Outstanding</div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: Number(customerNetOutstanding) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                    {Number(customerNetOutstanding) > 0 ? formatCurrency(customerNetOutstanding) : (Number(customerNetOutstanding) < 0 ? `${formatCurrency(Math.abs(Number(customerNetOutstanding)))} Cr` : 'Settled')}
                                </div>
                            </div>
                        </div>

                        <hr className="divider" style={{ margin: '0 0 1rem' }} />

                        {/* Line items table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>Description</th>
                                    <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>Qty</th>
                                    <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>Rate</th>
                                    <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item: ItemRow) => (
                                    <tr key={item.id}>
                                        <td style={{ padding: '0.625rem 0.25rem' }}>
                                            <div style={{ fontWeight: 500 }}>{item.description}</div>
                                            {item.remarks && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.remarks}</div>}
                                        </td>
                                        <td style={{ padding: '0.625rem 0.25rem', textAlign: 'right', color: 'var(--color-muted)' }}>
                                            {Number(item.quantity)} {item.unit}
                                        </td>
                                        <td style={{ padding: '0.625rem 0.25rem', textAlign: 'right' }} className="text-money">
                                            {formatCurrency(item.rate)}
                                        </td>
                                        <td style={{ padding: '0.625rem 0.25rem', textAlign: 'right' }} className="text-money">
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', gap: '3rem' }}>
                                    <span className="text-muted">Subtotal</span>
                                    <span className="text-money">{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                {Number(invoice.discountAmount) > 0 && (
                                    <div style={{ display: 'flex', gap: '3rem', color: 'var(--color-success)' }}>
                                        <span>Discount</span>
                                        <span className="text-money">− {formatCurrency(invoice.discountAmount)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '3rem', borderTop: '2px solid var(--color-border)', paddingTop: '0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
                                    <span>Total</span>
                                    <span className="text-money">{formatCurrency(invoice.totalAmount)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '3rem', color: 'var(--color-success)' }}>
                                    <span>Paid</span>
                                    <span className="text-money">{formatCurrency(invoice.paidAmount)}</span>
                                </div>
                                {Number(invoice.balanceDue) > 0 && (
                                    <div style={{ display: 'flex', gap: '3rem', color: 'var(--color-danger)', fontWeight: 700, fontSize: '1.1rem' }}>
                                        <span>Balance Due</span>
                                        <span className="text-money">{formatCurrency(invoice.balanceDue)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {invoice.remarks && (
                            <>
                                <hr className="divider" />
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Remarks</div>
                                    <p style={{ margin: 0, fontSize: '0.875rem' }}>{invoice.remarks}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Customer Info + Payment History */}
                <div>
                    {/* Customer card */}
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Customer</div>
                        <div style={{ fontWeight: 700 }}>{invoice.customer.name}</div>
                        {invoice.customer.businessName && <div className="text-muted">{invoice.customer.businessName}</div>}
                        {invoice.customer.city && <div className="text-muted">📍 {invoice.customer.city}</div>}
                        {primaryContact && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                👤 {primaryContact.name}
                                {primaryContact.phone && <span> · {primaryContact.phone}</span>}
                            </div>
                        )}
                        <Link href={`/customers/${invoice.customerId}`} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                            View Ledger →
                        </Link>
                    </div>

                    {/* Payment history */}
                    <div className="card">
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                            Payments ({invoice.allocations.length})
                        </div>
                        {invoice.allocations.length === 0 ? (
                            <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>No payments recorded yet.</p>
                        ) : (
                            invoice.allocations.map((alloc: AllocRow) => (
                                <div key={alloc.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span className="badge badge-green">{paymentMethodLabel(alloc.payment.method)}</span>
                                        <span className="text-money" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                                            {formatCurrency(alloc.amount)}
                                        </span>
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                                        {formatDate(alloc.payment.paymentDate)}
                                        {alloc.payment.reference && ` · Ref: ${alloc.payment.reference}`}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
