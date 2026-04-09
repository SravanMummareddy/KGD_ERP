import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import AdjustStockModal from '@/components/invoices/AdjustStockModal'
import DeleteButton from '@/components/ui/DeleteButton'
import { Suspense } from 'react'
import SearchInput from '@/components/ui/SearchInput'
import { deleteProduct } from '@/actions/products'

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const sp = await searchParams
    const q = sp.q?.trim() ?? ''
    const isAdmin = session.user.role === 'ADMIN'

    const searchFilter = q ? { name: { contains: q, mode: 'insensitive' as const } } : {}

    const products = await prisma.product.findMany({
        where: { isActive: true, ...searchFilter },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    const plates = products.filter((p: typeof products[number]) => p.type === 'PLATE')
    const sheets = products.filter((p: typeof products[number]) => p.type === 'SHEET')

    function ProductTable({ items, title }: { items: typeof products; title: string }) {
        return (
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">
                    <h2 className="section-title">{title}</h2>
                    <span className="badge badge-gray">{items.length} products</span>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '44px' }}>#</th>
                                <th>Product Name</th>
                                <th>Size</th>
                                <th>GSM</th>
                                <th>Color</th>
                                <th>Unit</th>
                                <th>Current Stock</th>
                                <th style={{ textAlign: 'right' }}>Default Rate</th>
                                <th style={{ width: isAdmin ? '120px' : '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={9}>
                                        <div className="empty-state">
                                            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                            </svg>
                                            <p className="empty-state-title">{q ? `No ${title.toLowerCase()} match your search` : `No ${title.toLowerCase()} yet`}</p>
                                            <p className="empty-state-desc">Add a product to see it listed here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {items.map((p: typeof products[number], i: number) => {
                                const packets = Math.floor(p.stockPieces / 14)
                                const loose = p.stockPieces % 14
                                return (
                                    <tr key={p.id}>
                                        <td className="text-muted text-xs">{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                                        <td className="text-muted">{p.sizeInches ? `${p.sizeInches}"` : '—'}</td>
                                        <td className="text-muted">{p.gsm ?? '—'}</td>
                                        <td className="text-muted">{p.color || '—'}</td>
                                        <td className="text-muted">{p.unitLabel}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{packets} Packets</div>
                                            {loose > 0 && <div className="text-muted text-xs">+{loose} Loose</div>}
                                        </td>
                                        <td style={{ textAlign: 'right' }} className="text-money">
                                            {p.defaultRate ? formatCurrency(p.defaultRate) : <span className="text-muted">—</span>}
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <AdjustStockModal productId={p.id} productName={p.name} currentStock={p.stockPieces} />
                                                <Link href={`/products/${p.id}/edit`} className="btn btn-ghost btn-icon" title="Edit product">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </Link>
                                                {isAdmin && (
                                                    <DeleteButton
                                                        action={deleteProduct.bind(null, p.id)}
                                                        title="Delete Product"
                                                        message={`Archive "${p.name}"? It will be moved to the Recycle Bin.`}
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
            </div>
        )
    }

    return (
        <div className="page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="page-subtitle">{products.length} {q ? 'results' : 'active products'}</p>
                </div>
                <Link href="/products/new" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.9rem', height: '0.9rem' }}>
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Product
                </Link>
            </div>

            {/* Search toolbar */}
            <div className="filter-toolbar">
                <Suspense>
                    <SearchInput placeholder="Search by name…" />
                </Suspense>
                {q && (
                    <Link href="/products" className="clear-filter-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.75rem', height: '0.75rem' }}>
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear
                    </Link>
                )}
            </div>

            <ProductTable items={plates} title="Plates" />
            <ProductTable items={sheets} title="Sheets" />
        </div>
    )
}
