'use client'

import { createProduct } from '@/actions/products'
import Link from 'next/link'
import SelectOrCustom from '@/components/invoices/SelectOrCustom'

export default function NewProductPage() {
    return (
        <>
            <div className="page-header">
                <h1 className="page-title">New Product</h1>
                <Link href="/products" className="btn btn-secondary">← Back</Link>
            </div>

            <div className="card" style={{ maxWidth: 560 }}>
                <form action={createProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Product Name *</label>
                        <input id="name" name="name" type="text" className="form-input"
                            placeholder="e.g. 10 inch Silver Plate 80 GSM" required />
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="type">Type *</label>
                            <select id="type" name="type" className="form-select" required>
                                <option value="PLATE">Plate</option>
                                <option value="SHEET">Sheet</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="unitLabel">Default Unit</label>
                            <select id="unitLabel" name="unitLabel" className="form-select">
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
                        />
                        <SelectOrCustom
                            name="gsm"
                            label="GSM"
                            options={['70', '80', '100', '120', '140']}
                            placeholder="Enter custom GSM"
                            inputType="number"
                        />
                    </div>

                    <div className="form-grid-2">
                        <SelectOrCustom
                            name="color"
                            label="Color"
                            options={['Silver', 'Gold', 'Green', 'White', 'Multi']}
                            placeholder="Enter custom color"
                        />
                        <div className="form-group">
                            <label className="form-label" htmlFor="defaultRate">Default Rate (₹)</label>
                            <input id="defaultRate" name="defaultRate" type="number" step="0.01" min="0"
                                className="form-input" placeholder="e.g. 90" />
                            <span className="form-error" style={{ color: 'var(--color-muted)', fontSize: '0.73rem' }}>
                                Always overridable on invoice
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="description">Description / Notes</label>
                        <textarea id="description" name="description" className="form-textarea" rows={2}
                            placeholder="Any extra details…" />
                    </div>

                    <hr className="divider" />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Link href="/products" className="btn btn-secondary">← Back</Link>
                        <button type="submit" className="btn btn-primary">Save Product →</button>
                    </div>
                </form>
            </div>
        </>
    )
}
