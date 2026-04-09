import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import RestoreButton from '@/components/ui/RestoreButton'
import { restoreCustomer, permanentDeleteCustomer } from '@/actions/customers'
import { restoreProduct, permanentDeleteProduct } from '@/actions/products'
import { restoreInventoryItem, permanentDeleteInventoryItem } from '@/actions/inventory'
import DeleteButton from '@/components/ui/DeleteButton'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDeletedField(obj: any, field: string) { return obj?.[field] ?? null }

export default async function DeletedItemsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')

    const sp = await searchParams
    const tab = sp.tab ?? 'customers'

    const [deletedCustomers, deletedProducts, deletedInventory, deletedByUsers] = await Promise.all([
        prisma.customer.findMany({
            where: { isActive: false },
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.product.findMany({
            where: { isActive: false },
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.inventoryItem.findMany({
            where: { isActive: false },
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.user.findMany({
            select: { id: true, name: true },
        }),
    ])

    const userMap = new Map<string, string | null>(
        deletedByUsers.map((u: { id: string; name: string | null }) => [u.id, u.name]),
    )

    const tabs = [
        { key: 'customers', label: 'Customers', count: deletedCustomers.length },
        { key: 'products', label: 'Products', count: deletedProducts.length },
        { key: 'inventory', label: 'Inventory', count: deletedInventory.length },
    ]

    const totalDeleted = deletedCustomers.length + deletedProducts.length + deletedInventory.length

    return (
        <div className="page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Recycle Bin</h1>
                    <p className="page-subtitle">{totalDeleted} deleted {totalDeleted === 1 ? 'item' : 'items'}</p>
                </div>
                <Link href="/admin/users" className="btn btn-secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Users
                </Link>
            </div>

            {totalDeleted > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem', flexShrink: 0 }}>
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>Permanent delete is irreversible. Items with financial records (invoices/payments) cannot be permanently deleted.</span>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem' }}>
                {tabs.map(t => (
                    <Link
                        key={t.key}
                        href={`/admin/deleted?tab=${t.key}`}
                        className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span className="badge badge-red" style={{ marginLeft: '0.375rem', fontSize: '0.65rem', padding: '0.1rem 0.375rem' }}>
                                {t.count}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Customers Tab */}
            {tab === 'customers' && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Business / Contact</th>
                                <th>City</th>
                                <th>Deleted At</th>
                                <th>Deleted By</th>
                                <th style={{ width: '160px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deletedCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="empty-state">
                                            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            </svg>
                                            <p className="empty-state-title">No deleted customers</p>
                                            <p className="empty-state-desc">Deleted customers will appear here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {deletedCustomers.map((c: typeof deletedCustomers[number], i: number) => (
                                <tr key={c.id}>
                                    <td className="text-muted text-xs">{i + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{c.businessName || c.name}</div>
                                        {c.businessName && <div className="text-muted text-xs">{c.name}</div>}
                                    </td>
                                    <td className="text-muted">{c.city || 'â€”'}</td>
                                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                                        {getDeletedField(c, 'deletedAt') ? formatDateTime(getDeletedField(c, 'deletedAt')) : 'â€”'}
                                    </td>
                                    <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                                        {c.deletedById ? (userMap.get(c.deletedById) ?? 'Unknown') : 'â€”'}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <RestoreButton action={restoreCustomer.bind(null, c.id)} />
                                            <DeleteButton
                                                action={permanentDeleteCustomer.bind(null, c.id)}
                                                title="Permanently Delete"
                                                message={`Permanently delete "${c.businessName || c.name}"? This CANNOT be undone.`}
                                                warningMessage="Only customers with no invoices or payments can be permanently deleted."
                                                confirmLabel="Delete Forever"
                                                iconOnly
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Products Tab */}
            {tab === 'products' && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>Type</th>
                                <th>Size / GSM</th>
                                <th>Deleted At</th>
                                <th>Deleted By</th>
                                <th style={{ width: '160px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deletedProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            </svg>
                                            <p className="empty-state-title">No deleted products</p>
                                            <p className="empty-state-desc">Deleted products will appear here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {deletedProducts.map((p: typeof deletedProducts[number], i: number) => (
                                <tr key={p.id}>
                                    <td className="text-muted text-xs">{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                                    <td>
                                        <span className="badge badge-gray">{p.type}</span>
                                    </td>
                                    <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                                        {p.sizeInches ? `${p.sizeInches}"` : 'â€”'} {p.gsm ? `/ ${p.gsm} GSM` : ''}
                                    </td>
                                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                                        {getDeletedField(p, 'deletedAt') ? formatDateTime(getDeletedField(p, 'deletedAt')) : 'â€”'}
                                    </td>
                                    <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                                        {p.deletedById ? (userMap.get(p.deletedById) ?? 'Unknown') : 'â€”'}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <RestoreButton action={restoreProduct.bind(null, p.id)} />
                                            <DeleteButton
                                                action={permanentDeleteProduct.bind(null, p.id)}
                                                title="Permanently Delete"
                                                message={`Permanently delete "${p.name}"? This CANNOT be undone.`}
                                                warningMessage="Products with invoice history cannot be permanently deleted."
                                                confirmLabel="Delete Forever"
                                                iconOnly
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Inventory Tab */}
            {tab === 'inventory' && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item</th>
                                <th>Category</th>
                                <th>Last Stock</th>
                                <th>Deleted At</th>
                                <th>Deleted By</th>
                                <th style={{ width: '160px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deletedInventory.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            </svg>
                                            <p className="empty-state-title">No deleted inventory items</p>
                                            <p className="empty-state-desc">Deleted items will appear here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {deletedInventory.map((item: typeof deletedInventory[number], i: number) => (
                                <tr key={item.id}>
                                    <td className="text-muted text-xs">{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                                    <td>
                                        <span className="badge badge-gray">{item.category}</span>
                                    </td>
                                    <td className="text-muted" style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem' }}>
                                        {Number(item.currentStock).toFixed(2)} {item.unit}
                                    </td>
                                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                                        {getDeletedField(item, 'deletedAt') ? formatDateTime(getDeletedField(item, 'deletedAt')) : 'â€”'}
                                    </td>
                                    <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                                        {item.deletedById ? (userMap.get(item.deletedById) ?? 'Unknown') : 'â€”'}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <RestoreButton action={restoreInventoryItem.bind(null, item.id)} />
                                            <DeleteButton
                                                action={permanentDeleteInventoryItem.bind(null, item.id)}
                                                title="Permanently Delete"
                                                message={`Permanently delete "${item.name}"?`}
                                                warningMessage="All transaction history for this item will also be deleted."
                                                confirmLabel="Delete Forever"
                                                iconOnly
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

