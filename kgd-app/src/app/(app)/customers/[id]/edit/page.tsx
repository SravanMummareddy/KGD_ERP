import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { updateCustomer } from '@/actions/customers'
import Link from 'next/link'

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const customer = await prisma.customer.findUnique({ where: { id: params.id } })
    if (!customer) notFound()

    const updateWithId = updateCustomer.bind(null, customer.id)
    async function handleUpdate(fd: FormData): Promise<void> { await updateWithId(fd) }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Edit Customer</h1>
                <Link href={`/customers/${customer.id}`} className="btn btn-secondary">← Back</Link>
            </div>

            <div className="card" style={{ maxWidth: 640 }}>
                <form action={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Customer Name *</label>
                            <input id="name" name="name" type="text" className="form-input" defaultValue={customer.name} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="businessName">Business / Shop Name</label>
                            <input id="businessName" name="businessName" type="text" className="form-input" defaultValue={customer.businessName ?? ''} />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="city">City</label>
                            <input id="city" name="city" type="text" className="form-input" defaultValue={customer.city ?? ''} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="defaultDiscount">Default Discount %</label>
                            <input id="defaultDiscount" name="defaultDiscount" type="number" step="0.01" min="0" max="100"
                                className="form-input" defaultValue={customer.defaultDiscount ? Number(customer.defaultDiscount) : ''} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="address">Address</label>
                        <input id="address" name="address" type="text" className="form-input" defaultValue={customer.address ?? ''} />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="notes">Notes</label>
                        <textarea id="notes" name="notes" className="form-textarea" rows={3} defaultValue={customer.notes ?? ''} />
                    </div>

                    <hr className="divider" />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Link href={`/customers/${customer.id}`} className="btn btn-secondary">Cancel</Link>
                        <button type="submit" className="btn btn-primary">Save Changes →</button>
                    </div>
                </form>
            </div>
        </>
    )
}
