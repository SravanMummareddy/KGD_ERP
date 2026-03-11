import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { addInventoryItem } from '@/actions/inventory'
import RecordMovementForm from '@/components/inventory/RecordMovementForm'

export default async function InventoryPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const items = await prisma.inventoryItem.findMany({
        where: { isActive: true },
        include: { transactions: { orderBy: { transactionDate: 'desc' }, take: 5 } },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const products = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    // Group by category
    type ItemRow = typeof items[number]
    const grouped: Record<string, typeof items> = {}
    for (const item of items) {
        if (!grouped[item.category]) grouped[item.category] = []
        grouped[item.category].push(item)
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Inventory</h1>
                    <p className="text-muted">Track raw material stock and movements</p>
                </div>
                <Link href="/dashboard" className="btn btn-secondary">← Dashboard</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Stock tables */}
                <div>
                    {/* Finished Goods Table */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Finished Goods (Plates & Sheets)
                        </h2>
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
                                    {products.map((p: typeof products[number]) => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 500 }}>{p.name}</td>
                                            <td className="text-muted">{p.sizeInches ? `${p.sizeInches}"` : '—'}</td>
                                            <td className="text-muted">{p.gsm ?? '—'}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                                {Math.floor(p.stockPieces / 14)} Packets
                                                {p.stockPieces % 14 > 0 && <div className="text-muted text-sm">+{p.stockPieces % 14} Loose</div>}
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No finished products found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Raw Material Tables grouped by category */}
                    {Object.entries(grouped).map(([category, categoryItems]) => (
                        <div key={category} style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Raw Material • {category}
                            </h2>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th style={{ textAlign: 'right' }}>Current Stock</th>
                                            <th>Unit</th>
                                            <th>Last Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryItems.map((item: ItemRow) => (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 500 }}>{item.name}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: Number(item.currentStock) <= 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                                    {Number(item.currentStock).toFixed(2)}
                                                </td>
                                                <td className="text-muted">{item.unit}</td>
                                                <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                    {item.transactions[0] ? formatDate(item.transactions[0].transactionDate) : 'Never'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <p className="text-muted">No inventory items yet. Add items using the form.</p>
                    )}
                </div>

                {/* Right panel: Forms */}
                <div>
                    {/* Record transaction */}
                    <RecordMovementForm items={items} products={products} />

                    {/* Add new item */}
                    <div className="card">
                        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Add New Inventory Item</h2>
                        <form action={addInventoryItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Item Name *</label>
                                <input name="name" type="text" className="form-input" placeholder="e.g. Brown Paper 700mm 80 GSM" required />
                            </div>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <input name="category" type="text" className="form-input" placeholder="Brown Paper" list="inv-cats" />
                                    <datalist id="inv-cats">
                                        <option value="Brown Paper" />
                                        <option value="Threads" />
                                        <option value="Films" />
                                        <option value="Gum Bags" />
                                        <option value="Covers" />
                                        <option value="Packing" />
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <select name="unit" className="form-select">
                                        <option value="kg">kg</option>
                                        <option value="roll">roll</option>
                                        <option value="piece">piece</option>
                                        <option value="bundle">bundle</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Opening Stock</label>
                                <input name="currentStock" type="number" step="0.001" min="0" defaultValue="0" className="form-input" />
                            </div>
                            <button type="submit" className="btn btn-secondary" style={{ justifyContent: 'center' }}>Add Item</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
