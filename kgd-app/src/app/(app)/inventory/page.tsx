import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { addInventoryTransaction, addInventoryItem } from '@/actions/inventory'

export default async function InventoryPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const items = await prisma.inventoryItem.findMany({
        where: { isActive: true },
        include: { transactions: { orderBy: { transactionDate: 'desc' }, take: 5 } },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
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
                <h1 className="page-title">Inventory</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Stock table */}
                <div>
                    {Object.entries(grouped).map(([category, categoryItems]) => (
                        <div key={category} style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {category}
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
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Record Stock Movement</h2>
                        <form action={addInventoryTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Item *</label>
                                <select name="inventoryItemId" className="form-select" required>
                                    <option value="">— Select item —</option>
                                    {items.map((item: ItemRow) => (
                                        <option key={item.id} value={item.id}>{item.name} ({Number(item.currentStock).toFixed(2)} {item.unit})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Type *</label>
                                    <select name="type" className="form-select">
                                        <option value="PURCHASE">Purchase (IN)</option>
                                        <option value="USAGE">Usage (OUT)</option>
                                        <option value="ADJUSTMENT">Adjustment</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantity *</label>
                                    <input name="quantity" type="number" step="0.001" min="0.001" className="form-input" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Rate / unit (₹)</label>
                                <input name="rate" type="number" step="0.01" min="0" className="form-input" placeholder="Optional" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <input name="notes" type="text" className="form-input" placeholder="Supplier name, remarks…" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Record Movement</button>
                        </form>
                    </div>

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
