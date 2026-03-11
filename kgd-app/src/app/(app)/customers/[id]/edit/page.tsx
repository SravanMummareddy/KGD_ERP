import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { updateCustomer } from '@/actions/customers'
import Link from 'next/link'

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session?.user) redirect('/login')

    const customer = await prisma.customer.findUnique({ where: { id } })
    if (!customer) notFound()

    const updateWithId = updateCustomer.bind(null, customer.id)

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Edit Customer</h1>
                <Link href={`/customers/${customer.id}`} className="btn btn-secondary">← Back</Link>
            </div>

            <div className="card" style={{ maxWidth: 640 }}>
                <form action={updateWithId} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="businessName">Business Name</label>
                            <input id="businessName" name="businessName" type="text" className="form-input"
                                placeholder="e.g. Sharma Traders" defaultValue={customer.businessName ?? ''} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Contact Person *</label>
                            <input id="name" name="name" type="text" className="form-input"
                                placeholder="e.g. Ramesh Sharma" defaultValue={customer.name} required />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">Phone Number</label>
                            <input id="phone" name="phone" type="tel" className="form-input"
                                placeholder="e.g. 9876543210" defaultValue={customer.phone ?? ''} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="secondaryPhone">Secondary Phone</label>
                            <input id="secondaryPhone" name="secondaryPhone" type="tel" className="form-input"
                                placeholder="Optional" defaultValue={customer.secondaryPhone ?? ''} />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="city">City</label>
                            <input id="city" name="city" type="text" className="form-input"
                                defaultValue={customer.city ?? ''} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="defaultDiscount">Default Discount %</label>
                            <input id="defaultDiscount" name="defaultDiscount" type="number" step="0.01" min="0" max="100"
                                className="form-input" defaultValue={customer.defaultDiscount ? Number(customer.defaultDiscount) : ''} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="address">Address</label>
                        <input id="address" name="address" type="text" className="form-input"
                            defaultValue={customer.address ?? ''} />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="notes">Notes</label>
                        <textarea id="notes" name="notes" className="form-textarea" rows={3} defaultValue={customer.notes ?? ''} />
                    </div>

                    <hr className="divider" />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Link href={`/customers/${customer.id}`} className="btn btn-secondary">Discard</Link>
                        <button type="submit" className="btn btn-primary">Save Changes →</button>
                    </div>
                </form>
            </div>
        </>
    )
}
