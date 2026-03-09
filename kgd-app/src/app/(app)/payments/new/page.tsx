import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { recordPayment } from '@/actions/payments'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function NewPaymentPage({
    searchParams,
}: {
    searchParams: Promise<{ customerId?: string; invoiceId?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const { customerId: defaultCustomerId, invoiceId: defaultInvoiceId } = await searchParams

    const customers = await prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    })

    // Load open invoices for the pre-selected customer
    const openInvoices = defaultCustomerId
        ? await prisma.invoice.findMany({
            where: { customerId: defaultCustomerId, status: { in: ['UNPAID', 'PARTIAL'] } },
            orderBy: { invoiceDate: 'asc' },
        })
        : []

    type CustomerRow = typeof customers[number]
    type OpenInvoiceRow = typeof openInvoices[number]

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Record Payment</h1>
                    <p className="text-muted">Record a customer payment against open invoices</p>
                </div>
                <Link href="/payments" className="btn btn-secondary">← Back</Link>
            </div>

            <div className="card" style={{ maxWidth: 640 }}>
                <form action={recordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Hidden customerId — read from select below */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="customerId">Customer *</label>
                        <select id="customerId" name="customerId" className="form-select" defaultValue={defaultCustomerId || ''} required>
                            <option value="">— Select Customer —</option>
                            {customers.map((c: CustomerRow) => (
                                <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` (${c.businessName})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="amount">Payment Amount (₹) *</label>
                            <input
                                id="amount" name="amount" type="number" step="0.01" min="0.01"
                                className="form-input" placeholder="e.g. 5000" required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="paymentDate">Payment Date *</label>
                            <input
                                id="paymentDate" name="paymentDate" type="date"
                                className="form-input"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="method">Payment Method</label>
                            <select id="method" name="method" className="form-select">
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CHEQUE">Cheque</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reference">Reference / UTR / Cheque #</label>
                            <input
                                id="reference" name="reference" type="text"
                                className="form-input" placeholder="Optional transaction reference"
                            />
                        </div>
                    </div>

                    {/* Invoice allocation */}
                    {openInvoices.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Apply to Invoices (select which to settle)</label>
                            <div style={{ border: '1px solid var(--color-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                {openInvoices.map((inv: OpenInvoiceRow) => (
                                    <label key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            name="invoiceIds"
                                            value={inv.id}
                                            defaultChecked={inv.id === defaultInvoiceId}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{inv.invoiceNumber}</span>
                                            <span className="text-muted" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>{formatDate(inv.invoiceDate)}</span>
                                        </div>
                                        <span className="text-money text-danger">{formatCurrency(inv.balanceDue)} due</span>
                                    </label>
                                ))}
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.775rem' }}>Payment is allocated in order (oldest first). Leave unchecked for unallocated/advance payment.</span>
                        </div>
                    )}

                    <input
                        type="hidden"
                        name="invoiceIds"
                        value={openInvoices
                            .filter((_: unknown, i: number) => i >= 0)  // include all — form checkboxes override this
                            .map((i: { id: string }) => i.id)
                            .join(',')}
                    />

                    <div className="form-group">
                        <label className="form-label" htmlFor="notes">Notes</label>
                        <textarea id="notes" name="notes" className="form-textarea" rows={2}
                            placeholder="Any notes about this payment…" />
                    </div>

                    <hr className="divider" />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Link href="/payments" className="btn btn-secondary">Cancel</Link>
                        <button type="submit" className="btn btn-primary">Record Payment →</button>
                    </div>
                </form>
            </div>
        </>
    )
}
