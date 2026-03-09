import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, invoiceStatusInfo, paymentMethodLabel } from '@/lib/utils'
import { addContact } from '@/actions/customers'

export default async function CustomerDetailPage({
    params,
}: {
    params: { id: string }
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const customer = await prisma.customer.findUnique({
        where: { id: params.id },
        include: {
            contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        },
    })

    if (!customer) notFound()

    // Get all invoices for the customer (ledger)
    const invoices = await prisma.invoice.findMany({
        where: { customerId: params.id },
        orderBy: { invoiceDate: 'desc' },
        include: { _count: { select: { items: true } } },
    })

    // Get all payments for the customer
    const payments = await prisma.payment.findMany({
        where: { customerId: params.id },
        orderBy: { paymentDate: 'desc' },
    })

    // Calculate totals
    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0)
    const totalOutstanding = invoices
        .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
        .reduce((sum, inv) => sum + Number(inv.balanceDue), 0)

    // Build a combined ledger timeline
    type LedgerEntry =
        | { type: 'invoice'; date: Date; label: string; amount: number; status: string; id: string; itemCount: number }
        | { type: 'payment'; date: Date; label: string; amount: number; method: string; notes: string | null }

    const ledger: LedgerEntry[] = [
        ...invoices.map((inv) => ({
            type: 'invoice' as const,
            date: inv.invoiceDate,
            label: inv.invoiceNumber,
            amount: Number(inv.totalAmount),
            status: inv.status,
            id: inv.id,
            itemCount: inv._count.items,
        })),
        ...payments.map((pay) => ({
            type: 'payment' as const,
            date: pay.paymentDate,
            label: `Payment via ${paymentMethodLabel(pay.method)}`,
            amount: Number(pay.amount),
            method: pay.method,
            notes: pay.notes,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">{customer.name}</h1>
                    {customer.businessName && <p className="text-muted">{customer.businessName}</p>}
                    {customer.city && <p className="text-muted">📍 {customer.city}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href={`/invoices/new?customerId=${customer.id}`} className="btn btn-primary">
                        + New Invoice
                    </Link>
                    <Link href={`/payments/new?customerId=${customer.id}`} className="btn btn-secondary">
                        Record Payment
                    </Link>
                    <Link href={`/customers/${customer.id}/edit`} className="btn btn-secondary">
                        Edit
                    </Link>
                </div>
            </div>

            {/* Balance Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-label">Total Billed</div>
                    <div className="stat-value">{formatCurrency(totalBilled)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Paid</div>
                    <div className="stat-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalPaid)}</div>
                </div>
                <div className="stat-card" style={{ border: totalOutstanding > 0 ? '2px solid #dc2626' : '' }}>
                    <div className="stat-label">Outstanding Balance</div>
                    <div className="stat-value" style={{ color: totalOutstanding > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {formatCurrency(totalOutstanding)}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Left: Ledger */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Transaction Ledger</h2>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th style={{ textAlign: 'right' }}>Invoice</th>
                                    <th style={{ textAlign: 'right' }}>Payment</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledger.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                            No transactions yet.
                                        </td>
                                    </tr>
                                )}
                                {ledger.map((entry, i) => {
                                    if (entry.type === 'invoice') {
                                        const info = invoiceStatusInfo(entry.status)
                                        return (
                                            <tr key={`inv-${i}`}>
                                                <td className="text-muted">{formatDate(entry.date)}</td>
                                                <td>
                                                    <Link href={`/invoices/${entry.id}`} style={{ fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                        {entry.label}
                                                    </Link>
                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{entry.itemCount} item(s)</div>
                                                </td>
                                                <td style={{ textAlign: 'right' }} className="text-money">{formatCurrency(entry.amount)}</td>
                                                <td style={{ textAlign: 'right' }}>—</td>
                                                <td><span className={`badge ${info.color}`}>{info.label}</span></td>
                                            </tr>
                                        )
                                    } else {
                                        return (
                                            <tr key={`pay-${i}`} style={{ background: '#f0fdf4' }}>
                                                <td className="text-muted">{formatDate(entry.date)}</td>
                                                <td>
                                                    <div style={{ fontWeight: 500, color: 'var(--color-success)' }}>{entry.label}</div>
                                                    {entry.notes && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{entry.notes}</div>}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>—</td>
                                                <td style={{ textAlign: 'right', color: 'var(--color-success)' }} className="text-money">
                                                    + {formatCurrency(entry.amount)}
                                                </td>
                                                <td><span className="badge badge-green">Payment</span></td>
                                            </tr>
                                        )
                                    }
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Contacts */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Contacts</h2>
                    </div>

                    <div className="card" style={{ marginBottom: '1rem' }}>
                        {customer.contacts.length === 0 && (
                            <p className="text-muted" style={{ margin: 0 }}>No contacts added yet.</p>
                        )}
                        {customer.contacts.map((c) => (
                            <div key={c.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                                    {c.isPrimary && <span className="badge badge-blue">Primary</span>}
                                </div>
                                {c.role && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{c.role}</div>}
                                {c.phone && <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>📞 {c.phone}</div>}
                            </div>
                        ))}
                    </div>

                    {/* Add Contact Form */}
                    <div className="card">
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>Add Contact</h3>
                        <form action={addContact.bind(null, customer.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input name="name" type="text" className="form-input" placeholder="Contact name" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input name="phone" type="text" className="form-input" placeholder="e.g. 9876543210" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <input name="role" type="text" className="form-input" placeholder="e.g. Owner, Manager" />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <input type="checkbox" name="isPrimary" value="on" />
                                Set as primary contact
                            </label>
                            <button type="submit" className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }}>
                                Add Contact
                            </button>
                        </form>
                    </div>

                    {/* Notes */}
                    {customer.notes && (
                        <div className="card" style={{ marginTop: '1rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.5rem' }}>NOTES</div>
                            <p style={{ margin: 0, fontSize: '0.875rem' }}>{customer.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
