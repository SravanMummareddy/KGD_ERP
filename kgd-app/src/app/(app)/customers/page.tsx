import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getCustomerOutstandingSummaries } from '@/lib/outstanding'

export default async function CustomersPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const customers = await prisma.customer.findMany({
        where: { isActive: true },
        include: {
            contacts: { where: { isPrimary: true }, take: 1 },
            _count: { select: { invoices: true } },
        },
        orderBy: { name: 'asc' },
    })

    const outstanding = await getCustomerOutstandingSummaries(customers.map((c) => c.id))
    const netOutstandingMap = new Map(outstanding.map((o) => [o.customerId, o.netOutstanding]))

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Customers</h1>
                    <p className="text-muted">{customers.length} active customers</p>
                </div>
                <Link href="/customers/new" className="btn btn-primary">
                    + New Customer
                </Link>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>City</th>
                            <th>Primary Contact</th>
                            <th>Invoices</th>
                            <th style={{ textAlign: 'right' }}>Outstanding</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No customers yet. <Link href="/customers/new">Add your first customer →</Link>
                                </td>
                            </tr>
                        )}
                        {customers.map((c) => {
                            const netOutstanding = Number(netOutstandingMap.get(c.id) ?? 0)
                            const contact = c.contacts[0]
                            return (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                                        {c.businessName && (
                                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>{c.businessName}</div>
                                        )}
                                    </td>
                                    <td className="text-muted">{c.city || '—'}</td>
                                    <td>
                                        {contact ? (
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{contact.name}</div>
                                                {contact.phone && (
                                                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{contact.phone}</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                    <td className="text-muted">{c._count.invoices}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        {netOutstanding > 0 ? (
                                            <span className="text-money text-danger">{formatCurrency(netOutstanding)}</span>
                                        ) : netOutstanding < 0 ? (
                                            <span className="text-money text-success">{formatCurrency(netOutstanding)}</span>
                                        ) : (
                                            <span className="badge badge-green">Settled</span>
                                        )}
                                    </td>
                                    <td>
                                        <Link href={`/customers/${c.id}`} className="btn btn-secondary btn-sm">
                                            View
                                        </Link>
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
