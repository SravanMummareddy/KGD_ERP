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
        select: {
            id: true,
            name: true,
            businessName: true,
            city: true,
            phone: true,
            secondaryPhone: true,
            _count: { select: { invoices: true } },
        },
        orderBy: { name: 'asc' },
    })

    const outstanding = await getCustomerOutstandingSummaries(customers.map((c: { id: string }) => c.id))
    const netOutstandingMap = new Map(outstanding.map((o) => [o.customerId, o.netOutstanding]))

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Customers</h1>
                    <p className="text-muted">{customers.length} active customers</p>
                </div>
                <Link href="/customers/new" className="btn btn-primary">+ New Customer</Link>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Business / Contact</th>
                            <th>Phone</th>
                            <th>Invoices</th>
                            <th style={{ textAlign: 'right' }}>Outstanding</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No customers yet. <Link href="/customers/new">Add your first customer →</Link>
                                </td>
                            </tr>
                        )}
                        {customers.map((c: typeof customers[number]) => {
                            const netOutstanding = Number(netOutstandingMap.get(c.id) ?? 0)
                            return (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            <Link href={`/customers/${c.id}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                                                {c.businessName || c.name}
                                            </Link>
                                        </div>
                                        {c.businessName && (
                                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>Contact: {c.name}</div>
                                        )}
                                        {c.city && <div className="text-muted" style={{ fontSize: '0.75rem' }}>📍 {c.city}</div>}
                                    </td>
                                    <td>
                                        {c.phone ? (
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.phone}</div>
                                                {c.secondaryPhone && (
                                                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{c.secondaryPhone}</div>
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
                                            <span className="text-money" style={{ color: 'var(--color-success)' }}>{formatCurrency(Math.abs(netOutstanding))} cr</span>
                                        ) : (
                                            <span className="badge badge-green">Settled</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <Link href={`/customers/${c.id}`} className="btn btn-secondary btn-sm">View</Link>
                                            <Link href={`/customers/${c.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                                        </div>
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
