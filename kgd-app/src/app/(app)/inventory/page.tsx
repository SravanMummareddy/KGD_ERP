import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import RecordMovementForm from '@/components/inventory/RecordMovementForm'
import AddNewItemForm from '@/components/inventory/AddNewItemForm'
import DeleteButton from '@/components/ui/DeleteButton'
import { deleteInventoryItem } from '@/actions/inventory'

export default async function InventoryPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const isAdmin = session.user.role === 'ADMIN'

    const items = await prisma.inventoryItem.findMany({
        where: { isActive: true },
        include: { transactions: { orderBy: { transactionDate: 'desc' }, take: 5 } },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const products = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    type ItemRow = typeof items[number]

    return (
        <div className="page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Inventory</h1>
                    <p className="page-subtitle">Track raw material stock and movements</p>
                </div>
                <Link href="/dashboard" className="btn btn-secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Dashboard
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Stock tables */}
                <div>
                    {/* Finished Goods */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div className="section-label">Finished Goods — Plates &amp; Sheets</div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Size</th>
                                        <th>GSM</th>
                                        <th style={{ textAlign: 'right' }}>Current Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p: typeof products[number]) => {
                                        const packets = Math.floor(p.stockPieces / 14)
                                        const loose = p.stockPieces % 14
                                        return (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: 500 }}>
                                                    <Link href={`/products/${p.id}/history`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                        {p.name}
                                                    </Link>
                                                </td>
                                                <td className="text-muted">{p.sizeInches ? `${p.sizeInches}"` : '—'}</td>
                                                <td className="text-muted">{p.gsm ?? '—'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                                    {packets} Packets
                                                    {loose > 0 && <div className="text-muted text-xs">+{loose} Loose</div>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan={4}>
                                                <div className="empty-state" style={{ padding: '2rem' }}>
                                                    <p className="empty-state-desc">No finished products found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Raw Materials */}
                    <div>
                        <div className="section-label">Raw Materials</div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '44px' }}>#</th>
                                        <th>Item Name</th>
                                        <th>Category</th>
                                        <th style={{ textAlign: 'right' }}>Current Stock</th>
                                        <th>Unit</th>
                                        <th>Last Updated</th>
                                        {isAdmin && <th style={{ width: '80px' }}>Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={isAdmin ? 7 : 6}>
                                                <div className="empty-state" style={{ padding: '2rem' }}>
                                                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="8" y1="6" x2="21" y2="6" />
                                                        <line x1="8" y1="12" x2="21" y2="12" />
                                                        <line x1="8" y1="18" x2="21" y2="18" />
                                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                                    </svg>
                                                    <p className="empty-state-title">No inventory items</p>
                                                    <p className="empty-state-desc">Add items using the form on the right.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {items.map((item: ItemRow, i: number) => {
                                        const stockNum = Number(item.currentStock)
                                        const isLow = stockNum <= 0
                                        return (
                                            <tr key={item.id}>
                                                <td className="text-muted text-xs">{i + 1}</td>
                                                <td style={{ fontWeight: 500 }}>
                                                    <Link href={`/inventory/${item.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                        {item.name}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <span className="badge badge-gray">{item.category}</span>
                                                </td>
                                                <td style={{
                                                    textAlign: 'right',
                                                    fontWeight: 700,
                                                    fontVariantNumeric: 'tabular-nums',
                                                    color: isLow ? 'var(--color-danger)' : 'var(--color-success)'
                                                }}>
                                                    {stockNum.toFixed(2)}
                                                </td>
                                                <td className="text-muted">{item.unit}</td>
                                                <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                    {item.transactions[0] ? formatDate(item.transactions[0].transactionDate) : 'Never'}
                                                </td>
                                                {isAdmin && (
                                                    <td>
                                                        <DeleteButton
                                                            action={deleteInventoryItem.bind(null, item.id)}
                                                            title="Delete Item"
                                                            message={`Archive "${item.name}"? Transaction history will be preserved.`}
                                                            confirmLabel="Move to Bin"
                                                            iconOnly
                                                        />
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right panel: Forms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <RecordMovementForm items={items} products={products} />
                    <AddNewItemForm />
                </div>
            </div>
        </div>
    )
}
