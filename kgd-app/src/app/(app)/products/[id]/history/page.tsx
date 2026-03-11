import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import Pagination from '@/components/ui/Pagination'

type TimelineEvent = {
    id: string
    date: Date
    type: 'PRODUCTION' | 'ADJUSTMENT' | 'SALE' | 'CANCELLED_SALE'
    quantityPieces: number
    description: string
    userOrCustomer: string
    link?: string
    isAddition: boolean
}

export default async function ProductHistoryPage({
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

    const product = await prisma.product.findUnique({
        where: { id: p.id }
    })

    if (!product) {
        return (
            <div className="page-header">
                <h1 className="page-title">Product Not Found</h1>
                <Link href="/inventory" className="btn btn-secondary">← Back to Inventory</Link>
            </div>
        )
    }

    const currentPage = Number(sp.page) || 1
    const ITEMS_PER_PAGE = 20

    // 1. Fetch Audit Logs for this product related to stock updates
    const auditLogs = await prisma.auditLog.findMany({
        where: { 
            entity: 'Product', 
            entityId: p.id,
            action: 'UPDATE',
            // Only logs where stockPieces changed (we check JSON structure in memory)
        },
        include: { user: true }
    })

    // 2. Fetch Invoice Items for this product
    const invoiceItems = await prisma.invoiceItem.findMany({
        where: { productId: p.id },
        include: { invoice: { include: { customer: true } } }
    })

    // Combine and normalize events
    const timeline: TimelineEvent[] = []

    // Parse audit logs
    for (const log of auditLogs) {
        const nv = log.newValues as any
        if (nv && (nv.piecesMoved || nv.piecesAdded)) {
            const moved = nv.piecesMoved || nv.piecesAdded
            const typeValue = nv.type === 'OUT' ? 'ADJUSTMENT' : 'PRODUCTION'
            timeline.push({
                id: log.id,
                date: log.performedAt,
                type: typeValue,
                quantityPieces: moved,
                description: nv.reason || 'Manual Adjustment',
                userOrCustomer: `User: ${log.user.name}`,
                isAddition: nv.type !== 'OUT'
            })
        }
    }

    // Parse invoices
    for (const item of invoiceItems) {
        if (!item.invoice) continue // Orphan protection
        const pQty = item.unit.toLowerCase() === 'packet' ? Number(item.quantity) * 14 : Number(item.quantity)
        const isCancelled = item.invoice.status === 'CANCELLED'
        
        timeline.push({
            id: item.id,
            date: item.invoice.invoiceDate,
            type: isCancelled ? 'CANCELLED_SALE' : 'SALE',
            quantityPieces: pQty,
            description: `Invoice ${item.invoice.invoiceNumber}`,
            userOrCustomer: `${item.invoice.customer.businessName || item.invoice.customer.name}`,
            link: `/invoices/${item.invoice.id}`,
            isAddition: isCancelled // cancelled sales put stock back
        })
    }

    // Sort descending by date
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime())

    // Apply pagination
    const totalEvents = timeline.length
    const totalPages = Math.ceil(totalEvents / ITEMS_PER_PAGE)
    const paginatedEvents = timeline.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    const currentPackets = Math.floor(product.stockPieces / 14)
    const currentLoose = product.stockPieces % 14

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{product.name} (Ledger)</h1>
                    <p className="text-muted">
                        Current Stock: <strong style={{ color: 'var(--color-primary)' }}>
                            {currentPackets} Pkts {currentLoose > 0 ? `+ ${currentLoose} loose` : ''}
                        </strong>
                    </p>
                </div>
                <Link href="/inventory" className="btn btn-secondary">← Back to Inventory</Link>
            </div>

            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Stock Timeline</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Event Type</th>
                            <th style={{ textAlign: 'right' }}>Quantity</th>
                            <th>Description</th>
                            <th>Entity (User/Customer)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEvents.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No stock movements recorded yet.
                                </td>
                            </tr>
                        )}
                        {paginatedEvents.map(evt => (
                            <tr key={evt.id}>
                                <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    {formatDateTime(evt.date)}
                                </td>
                                <td>
                                    <span className={`badge ${
                                        evt.type === 'PRODUCTION' ? 'badge-green' : 
                                        evt.type === 'SALE' ? 'badge-blue' :
                                        evt.type === 'CANCELLED_SALE' ? 'badge-amber' : 'badge-red'
                                    }`}>
                                        {evt.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td style={{ 
                                    textAlign: 'right', 
                                    fontWeight: 600, 
                                    color: evt.isAddition ? 'var(--color-success)' : 'var(--color-danger)'
                                }}>
                                    {evt.isAddition ? '+' : '-'}{evt.quantityPieces} pieces
                                    <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 400 }}>
                                        ({Math.floor(evt.quantityPieces / 14)} Pkts)
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.85rem', fontWeight: evt.link ? 600 : 400 }}>
                                    {evt.link ? (
                                        <Link href={evt.link} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                            {evt.description}
                                        </Link>
                                    ) : (
                                        evt.description
                                    )}
                                </td>
                                <td className="text-muted" style={{ fontSize: '0.85rem' }}>{evt.userOrCustomer}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination totalPages={totalPages} currentPage={currentPage} />
        </>
    )
}
