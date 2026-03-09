import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function ProductsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const products = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    const plates = products.filter((p) => p.type === 'PLATE')
    const sheets = products.filter((p) => p.type === 'SHEET')

    function ProductTable({ items, title }: { items: typeof products; title: string }) {
        return (
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{title}</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Size</th>
                                <th>GSM</th>
                                <th>Color</th>
                                <th>Unit</th>
                                <th style={{ textAlign: 'right' }}>Default Rate</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '1.5rem' }}>
                                        No products yet.
                                    </td>
                                </tr>
                            )}
                            {items.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                                    <td className="text-muted">{p.sizeInches ? `${p.sizeInches}"` : '—'}</td>
                                    <td className="text-muted">{p.gsm ?? '—'}</td>
                                    <td className="text-muted">{p.color || '—'}</td>
                                    <td className="text-muted">{p.unitLabel}</td>
                                    <td style={{ textAlign: 'right' }} className="text-money">
                                        {p.defaultRate ? formatCurrency(p.defaultRate) : <span className="text-muted">—</span>}
                                    </td>
                                    <td>
                                        <Link href={`/products/${p.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="text-muted">{products.length} active products</p>
                </div>
                <Link href="/products/new" className="btn btn-primary">+ New Product</Link>
            </div>

            <ProductTable items={plates} title="Plates" />
            <ProductTable items={sheets} title="Sheets" />
        </>
    )
}
