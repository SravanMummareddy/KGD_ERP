import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import Pagination from '@/components/ui/Pagination'

export default async function InventoryItemHistoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ page?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const p = await params
    const sp = await searchParams

    const item = await prisma.inventoryItem.findUnique({
        where: { id: p.id }
    })

    if (!item) {
        return (
            <div className="page-header">
                <h1 className="page-title">Item Not Found</h1>
                <Link href="/inventory" className="btn btn-secondary">← Back to Inventory</Link>
            </div>
        )
    }

    const currentPage = Number(sp.page) || 1
    const ITEMS_PER_PAGE = 20

    const totalTransactions = await prisma.inventoryTransaction.count({
        where: { inventoryItemId: p.id }
    })
    const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE)

    const transactions = await prisma.inventoryTransaction.findMany({
        where: { inventoryItemId: p.id },
        include: { createdBy: { select: { name: true } } },
        orderBy: { transactionDate: 'desc' },
        take: ITEMS_PER_PAGE,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
    })

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{item.name}</h1>
                    <p className="text-muted">
                        Current Stock: <strong style={{ color: Number(item.currentStock) < 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                            {Number(item.currentStock).toFixed(2)} {item.unit}
                        </strong>
                    </p>
                </div>
                <Link href="/inventory" className="btn btn-secondary">← Back to Inventory</Link>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                <div>
                    <div className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</div>
                    <div style={{ fontWeight: 600 }}>{item.category}</div>
                </div>
                <div>
                    <div className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Movements</div>
                    <div style={{ fontWeight: 600 }}>{totalTransactions} records</div>
                </div>
            </div>

            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Movement Ledger</h2>
            
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date / Time</th>
                            <th>Type</th>
                            <th style={{ textAlign: 'right' }}>Quantity</th>
                            <th style={{ textAlign: 'right' }}>Rate / Value</th>
                            <th>Notes</th>
                            <th>Recorded By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No movements recorded yet.
                                </td>
                            </tr>
                        )}
                        {transactions.map((tx: typeof transactions[number]) => (
                            <tr key={tx.id}>
                                <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    {formatDateTime(tx.transactionDate)}
                                </td>
                                <td>
                                    <span className={`badge ${
                                        tx.type === 'PURCHASE' ? 'badge-green' : 
                                        tx.type === 'USAGE' ? 'badge-blue' : 'badge-amber'
                                    }`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: Number(tx.quantity) > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {Number(tx.quantity) > 0 ? '+' : ''}{Number(tx.quantity).toFixed(2)} {item.unit}
                                </td>
                                <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                                    {Number(tx.rate) > 0 ? (
                                        <>
                                            <div className="text-muted">@ {formatCurrency(tx.rate)}</div>
                                            <div className="text-money">{formatCurrency(tx.totalCost)}</div>
                                        </>
                                    ) : (
                                        <span className="text-muted">—</span>
                                    )}
                                </td>
                                <td className="text-muted" style={{ fontSize: '0.85rem' }}>{tx.notes || '—'}</td>
                                <td style={{ fontSize: '0.85rem' }}>{tx.createdBy.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination totalPages={totalPages} currentPage={currentPage} />
        </>
    )
}
