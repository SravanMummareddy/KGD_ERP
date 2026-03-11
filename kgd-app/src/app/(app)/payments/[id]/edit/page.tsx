import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { updatePayment } from '@/actions/payments'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session?.user) redirect('/login')

    const payment = await prisma.payment.findUnique({
        where: { id },
        include: { customer: true },
    })
    if (!payment) notFound()

    const updateWithId = updatePayment.bind(null, payment.id)

    // Format date for input[type=date]
    const dateStr = payment.paymentDate.toISOString().slice(0, 10)

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Edit Payment</h1>
                    <p className="text-muted">
                        {payment.customer.businessName || payment.customer.name} —{' '}
                        recorded on {formatDate(payment.paymentDate)}
                    </p>
                </div>
                <Link href={`/customers/${payment.customerId}`} className="btn btn-secondary">← Back</Link>
            </div>

            <div className="card" style={{ maxWidth: 560 }}>
                <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                    ⚠️ Editing a payment will recalculate all invoice balances and is recorded in the audit log.
                </div>

                <form action={updateWithId} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="amount">Amount (₹) *</label>
                            <input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="form-input"
                                defaultValue={Number(payment.amount)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="paymentDate">Payment Date</label>
                            <input id="paymentDate" name="paymentDate" type="date" className="form-input" defaultValue={dateStr} />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="method">Payment Method</label>
                            <select id="method" name="method" className="form-input" defaultValue={payment.method}>
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CHEQUE">Cheque</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reference">Reference / Txn ID</label>
                            <input id="reference" name="reference" type="text" className="form-input" defaultValue={payment.reference ?? ''} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reason">Reason for Edit *</label>
                        <select id="reason" name="reason" className="form-input" required>
                            <option value="">— Select a reason —</option>
                            <option value="Correction">Correction</option>
                            <option value="Duplicate Entry">Duplicate Entry</option>
                            <option value="Customer Adjustment">Customer Adjustment</option>
                            <option value="Refund">Refund</option>
                            <option value="Other">Other (type below)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reasonOther">If &quot;Other&quot;, please specify</label>
                        <input id="reasonOther" name="reasonOther" type="text" className="form-input" placeholder="Explain the reason…" />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="notes">Notes</label>
                        <textarea id="notes" name="notes" className="form-textarea" rows={2} defaultValue={payment.notes ?? ''} />
                    </div>

                    <hr className="divider" />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Link href={`/customers/${payment.customerId}`} className="btn btn-secondary">Discard</Link>
                        <button type="submit" className="btn btn-primary">Save Changes →</button>
                    </div>
                </form>
            </div>
        </>
    )
}
