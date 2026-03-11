import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { addInventoryItem } from '@/actions/inventory'
import RecordMovementForm from '@/components/inventory/RecordMovementForm'
import AddNewItemForm from '@/components/inventory/AddNewItemForm'

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

    type ItemRow = typeof items[number]

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
                                            <td style={{ fontWeight: 500 }}>
                                                <Link href={`/products/${p.id}/history`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                    {p.name}
                                                </Link>
                                            </td>
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

                    {/* Consolidated Raw Material Table */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Raw Materials
                        </h2>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px', color: 'var(--color-muted)' }}>#</th>
                                        <th>Item Name</th>
                                        <th>Category</th>
                                        <th style={{ textAlign: 'right' }}>Current Stock</th>
                                        <th>Unit</th>
                                        <th>Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No inventory items yet. Add items using the form.</td>
                                        </tr>
                                    )}
                                    {items.map((item: ItemRow, i: number) => (
                                        <tr key={item.id}>
                                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>{i + 1}</td>
                                            <td style={{ fontWeight: 500 }}>
                                                <Link href={`/inventory/${item.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                    {item.name}
                                                </Link>
                                            </td>
                                            <td className="text-muted">{item.category}</td>
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
                </div>

                {/* Right panel: Forms */}
                <div>
                    {/* Record transaction */}
                    <RecordMovementForm items={items} products={products} />

                    {/* Add new item */}
                    <AddNewItemForm />
                </div>
            </div>
        </>
    )
}
