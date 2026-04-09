import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getCustomerOutstandingSummaries } from '@/lib/outstanding'
import Pagination from '@/components/ui/Pagination'
import DeleteButton from '@/components/ui/DeleteButton'
import { Suspense } from 'react'
import SearchInput from '@/components/ui/SearchInput'
import { deleteCustomer } from '@/actions/customers'

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const sp = await searchParams
    const currentPage = Number(sp.page) || 1
    const ITEMS_PER_PAGE = 10
    const q = sp.q?.trim() ?? ''
    const isAdmin = session.user.role === 'ADMIN'

    const searchFilter = q ? {
        OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { businessName: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
        ],
    } : {}

    const whereClause = { isActive: true, ...searchFilter }

    const totalCustomers = await prisma.customer.count({ where: whereClause })
    const totalPages = Math.ceil(totalCustomers / ITEMS_PER_PAGE)

    const customers = await prisma.customer.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            businessName: true,
            city: true,
            phone: true,
            secondaryPhone: true,
            contacts: { select: { phone: true } },
            _count: { select: { invoices: true } },
        },
        orderBy: { name: 'asc' },
        take: ITEMS_PER_PAGE,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
    })

    const outstanding = await getCustomerOutstandingSummaries(customers.map((c: { id: string }) => c.id))
    const netOutstandingMap = new Map(outstanding.map((o) => [o.customerId, o.netOutstanding]))

    return (
        <div className="page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Customers</h1>
                    <p className="page-subtitle">
                        {totalCustomers} {q ? 'results' : 'active customers'}
                    </p>
                </div>
                <Link href="/customers/new" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.9rem', height: '0.9rem' }}>
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Customer
                </Link>
            </div>

            {/* Search + filter toolbar */}
            <div className="filter-toolbar">
                <Suspense>
                    <SearchInput placeholder="Search by name, business, phone…" />
                </Suspense>
                {q && (
                    <Link href="/customers" className="clear-filter-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.75rem', height: '0.75rem' }}>
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear
                    </Link>
                )}
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '44px' }}>#</th>
                            <th>Business / Contact</th>
                            <th>Phone</th>
                            <th>Invoices</th>
                            <th style={{ textAlign: 'right' }}>Outstanding</th>
                            <th style={{ width: isAdmin ? '100px' : '80px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={6}>
                                    <div className="empty-state">
                                        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        <p className="empty-state-title">{q ? 'No customers match your search' : 'No customers yet'}</p>
                                        <p className="empty-state-desc">{q ? `No results for "${q}"` : 'Add your first customer to get started.'}</p>
                                        {q
                                            ? <Link href="/customers" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>Clear Search</Link>
                                            : <Link href="/customers/new" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>Add Customer</Link>
                                        }
                                    </div>
                                </td>
                            </tr>
                        )}
                        {customers.map((c: typeof customers[number], i: number) => {
                            const netOutstanding = Number(netOutstandingMap.get(c.id) ?? 0)
                            const serialNumber = (currentPage - 1) * ITEMS_PER_PAGE + i + 1
                            return (
                                <tr key={c.id}>
                                    <td className="text-muted text-xs">{serialNumber}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            <Link href={`/customers/${c.id}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                                                {c.businessName || c.name}
                                            </Link>
                                        </div>
                                        {c.businessName && (
                                            <div className="text-muted text-xs">Contact: {c.name}</div>
                                        )}
                                        {c.city && (
                                            <div className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.1rem' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.7rem', height: '0.7rem' }}>
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </svg>
                                                {c.city}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {c.phone || c.contacts[0]?.phone ? (
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                    {c.phone || c.contacts[0]?.phone}
                                                </div>
                                                {c.secondaryPhone && (
                                                    <div className="text-muted text-xs">{c.secondaryPhone}</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="badge badge-gray">{c._count.invoices}</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {netOutstanding > 0 ? (
                                            <span className="text-money text-danger">{formatCurrency(netOutstanding)}</span>
                                        ) : netOutstanding < 0 ? (
                                            <span className="text-money text-success">{formatCurrency(Math.abs(netOutstanding))} cr</span>
                                        ) : (
                                            <span className="badge badge-green">Settled</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <Link href={`/customers/${c.id}`} className="btn btn-secondary btn-sm">View</Link>
                                            <Link href={`/customers/${c.id}/edit`} className="btn btn-ghost btn-icon" title="Edit customer">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </Link>
                                            {isAdmin && (
                                                <DeleteButton
                                                    action={deleteCustomer.bind(null, c.id)}
                                                    title="Delete Customer"
                                                    message={`Archive "${c.businessName || c.name}"? They will be moved to the Recycle Bin.`}
                                                    warningMessage={netOutstanding > 0 ? `This customer has an outstanding balance of ${formatCurrency(netOutstanding)}. All invoices must be settled before deletion.` : undefined}
                                                    confirmLabel="Move to Bin"
                                                    iconOnly
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>
    )
}
