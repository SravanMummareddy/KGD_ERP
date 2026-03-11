import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { updateProduct } from '@/actions/products'
import Link from 'next/link'
import SelectOrCustom from '@/components/invoices/SelectOrCustom'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session?.user) redirect('/login')

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) notFound()

    const updateWithId = updateProduct.bind(null, product.id)

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Edit Product</h1>
                    <p className="text-muted">{product.name}</p>
                </div>
                <Link href="/products" className="btn btn-secondary">← Products</Link>
            </div>

            <div className="card" style={{ maxWidth: 560 }}>
                <form action={updateWithId} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Product Name *</label>
                        <input id="name" name="name" type="text" className="form-input"
                            defaultValue={product.name} required />
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="type">Type *</label>
                            <select id="type" name="type" className="form-select" defaultValue={product.type} required>
                                <option value="PLATE">Plate</option>
                                <option value="SHEET">Sheet</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="unitLabel">Default Unit</label>
                            <select id="unitLabel" name="unitLabel" className="form-select" defaultValue={product.unitLabel}>
                                <option value="packet">Packet</option>
                                <option value="piece">Piece (Loose)</option>
                                <option value="kg">kg</option>
                                <option value="sheet">Sheet</option>
                                <option value="roll">Roll</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <SelectOrCustom
                            name="sizeInches"
                            label="Size (inches)"
                            options={['6', '8', '10', '12', '14']}
                            placeholder="Enter custom size"
                            inputType="number"
                            step="0.5"
                            defaultValue={product.sizeInches ? String(Number(product.sizeInches)) : undefined}
                        />
                        <SelectOrCustom
                            name="gsm"
                            label="GSM"
                            options={['70', '80', '100', '120', '140']}
                            placeholder="Enter custom GSM"
                            inputType="number"
                            defaultValue={product.gsm ? String(product.gsm) : undefined}
                        />
                    </div>

                    <div className="form-grid-2">
                        <SelectOrCustom
                            name="color"
                            label="Color"
                            options={['Silver', 'Gold', 'Green', 'White', 'Multi']}
                            placeholder="Enter custom color"
                            defaultValue={product.color ?? undefined}
                        />
                        <div className="form-group">
                            <label className="form-label" htmlFor="defaultRate">Default Rate (₹)</label>
                            <input id="defaultRate" name="defaultRate" type="number" step="0.01" min="0"
                                className="form-input"
                                defaultValue={product.defaultRate ? Number(product.defaultRate) : ''} />
                            <span className="form-error" style={{ color: 'var(--color-muted)', fontSize: '0.73rem' }}>
                                Always overridable on invoice
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="description">Description / Notes</label>
                        <textarea id="description" name="description" className="form-textarea" rows={2}
                            defaultValue={product.description ?? ''} />
                    </div>

                    <hr className="divider" />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Link href="/products" className="btn btn-secondary">Discard</Link>
                        <button type="submit" className="btn btn-primary">Save Changes →</button>
                    </div>
                </form>
            </div>
        </>
    )
}
