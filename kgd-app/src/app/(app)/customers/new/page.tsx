import { createCustomer } from '@/actions/customers'
import Link from 'next/link'

export default function NewCustomerPage() {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">New Customer</h1>
                    <p className="text-muted">Add a new customer to the system</p>
                </div>
                <Link href="/customers" className="btn btn-secondary">← Back</Link>
            </div>

            <div className="card" style={{ maxWidth: 640 }}>
                <form action={createCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="businessName">Business Name</label>
                            <input
                                id="businessName"
                                name="businessName"
                                type="text"
                                className="form-input"
                                placeholder="e.g. Sharma Traders"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Contact Person *</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="form-input"
                                placeholder="e.g. Ramesh Sharma"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                className="form-input"
                                placeholder="e.g. 9876543210"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="secondaryPhone">Secondary Phone</label>
                            <input
                                id="secondaryPhone"
                                name="secondaryPhone"
                                type="tel"
                                className="form-input"
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="city">City</label>
                            <input
                                id="city"
                                name="city"
                                type="text"
                                className="form-input"
                                placeholder="e.g. Vijayawada"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="defaultDiscount">Default Discount %</label>
                            <input
                                id="defaultDiscount"
                                name="defaultDiscount"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                className="form-input"
                                placeholder="e.g. 5"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="address">Address</label>
                        <input
                            id="address"
                            name="address"
                            type="text"
                            className="form-input"
                            placeholder="Full address"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="notes">Notes</label>
                        <textarea
                            id="notes"
                            name="notes"
                            className="form-textarea"
                            rows={3}
                            placeholder="Any notes about this customer…"
                        />
                    </div>

                    <hr className="divider" />

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Link href="/customers" className="btn btn-secondary">← Back</Link>
                        <button type="submit" className="btn btn-primary">Save Customer →</button>
                    </div>
                </form>
            </div>
        </>
    )
}
