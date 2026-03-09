'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createInvoice } from '@/actions/invoices'

interface Customer { id: string; name: string; businessName: string | null }
interface Product { id: string; name: string; type: string; unitLabel: string; defaultRate?: number }

interface LineItem {
    productId: string
    description: string
    quantity: number
    unit: string
    rate: number
    remarks: string
}

const EMPTY_ITEM: LineItem = {
    productId: '', description: '', quantity: 1, unit: 'packet', rate: 0, remarks: '',
}

export default function InvoiceForm({
    customers,
    products,
    defaultCustomerId,
}: {
    customers: Customer[]
    products: Product[]
    defaultCustomerId?: string
}) {
    const router = useRouter()
    const [customerId, setCustomerId] = useState(defaultCustomerId || '')
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
    const [dueDate, setDueDate] = useState('')
    const [discount, setDiscount] = useState(0)
    const [remarks, setRemarks] = useState('')
    const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // ─── Item helpers ────────────────────────────────────────────────

    function updateItem(idx: number, field: keyof LineItem, value: string | number) {
        setItems((prev) => {
            const next = [...prev]
            next[idx] = { ...next[idx], [field]: value }
            return next
        })
    }

    function selectProduct(idx: number, productId: string) {
        const product = products.find((p) => p.id === productId)
        if (!product) return
        setItems((prev) => {
            const next = [...prev]
            next[idx] = {
                ...next[idx],
                productId,
                description: product.name,
                unit: product.unitLabel,
                rate: product.defaultRate ?? 0,  // editable — just a suggestion
            }
            return next
        })
    }

    function addItem() {
        setItems((prev) => [...prev, { ...EMPTY_ITEM }])
    }

    function removeItem(idx: number) {
        if (items.length === 1) return
        setItems((prev) => prev.filter((_, i) => i !== idx))
    }

    // ─── Totals ───────────────────────────────────────────────────────

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0)
    const totalAmount = Math.max(0, subtotal - discount)

    // ─── Submit ───────────────────────────────────────────────────────

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        const fd = new FormData()
        fd.set('customerId', customerId)
        fd.set('invoiceDate', invoiceDate)
        fd.set('dueDate', dueDate)
        fd.set('discountAmount', String(discount))
        fd.set('remarks', remarks)
        fd.set('items', JSON.stringify(items))

        const result = await createInvoice(fd)
        setSubmitting(false)

        if (result?.error) {
            setError(result.error)
        }
        // On success, createInvoice redirects — no action needed here
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">New Invoice</h1>
                    <p className="text-muted">Create a new sales invoice</p>
                </div>
                <Link href="/invoices" className="btn btn-secondary">← Back</Link>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                {/* ─── Header ─── */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                    <div className="form-grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="customerId">Customer *</label>
                            <select
                                id="customerId"
                                className="form-select"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                required
                            >
                                <option value="">— Select Customer —</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.businessName ? ` (${c.businessName})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-grid-2" style={{ gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="invoiceDate">Invoice Date *</label>
                                <input
                                    id="invoiceDate"
                                    type="date"
                                    className="form-input"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="dueDate">Due Date</label>
                                <input
                                    id="dueDate"
                                    type="date"
                                    className="form-input"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Line Items ─── */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Line Items</h2>
                        <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">+ Add Row</button>
                    </div>

                    {/* Header row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 3fr 80px 80px 90px 100px 80px 32px',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0 0 0.5rem',
                        borderBottom: '1px solid var(--color-border)',
                        marginBottom: '0.75rem',
                    }}>
                        <span>Product</span>
                        <span>Description</span>
                        <span>Qty</span>
                        <span>Unit</span>
                        <span style={{ textAlign: 'right' }}>Rate (₹)</span>
                        <span style={{ textAlign: 'right' }}>Amount</span>
                        <span>Remarks</span>
                        <span />
                    </div>

                    {items.map((item, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 3fr 80px 80px 90px 100px 80px 32px',
                                gap: '0.5rem',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '1px solid #f1f5f9',
                            }}
                        >
                            {/* Product picker */}
                            <select
                                className="form-select"
                                value={item.productId}
                                onChange={(e) => selectProduct(idx, e.target.value)}
                                style={{ fontSize: '0.83rem' }}
                            >
                                <option value="">Manual entry</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>

                            {/* Description */}
                            <input
                                type="text"
                                className="form-input"
                                value={item.description}
                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                placeholder="Description *"
                                required
                                style={{ fontSize: '0.83rem' }}
                            />

                            {/* Quantity */}
                            <input
                                type="number"
                                className="form-input"
                                value={item.quantity}
                                min="0.001"
                                step="0.001"
                                onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                style={{ fontSize: '0.83rem' }}
                            />

                            {/* Unit */}
                            <select
                                className="form-select"
                                value={item.unit}
                                onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                                style={{ fontSize: '0.83rem' }}
                            >
                                <option value="packet">pkt</option>
                                <option value="piece">pc</option>
                                <option value="kg">kg</option>
                                <option value="sheet">sht</option>
                                <option value="roll">roll</option>
                            </select>

                            {/* Rate — always manually confirmed */}
                            <input
                                type="number"
                                className="form-input"
                                value={item.rate}
                                min="0"
                                step="0.01"
                                onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                style={{ fontSize: '0.83rem', textAlign: 'right' }}
                            />

                            {/* Computed Amount */}
                            <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                                {fmt(item.quantity * item.rate)}
                            </div>

                            {/* Remarks */}
                            <input
                                type="text"
                                className="form-input"
                                value={item.remarks}
                                onChange={(e) => updateItem(idx, 'remarks', e.target.value)}
                                placeholder="Note"
                                style={{ fontSize: '0.78rem' }}
                            />

                            {/* Remove */}
                            <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                disabled={items.length === 1}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--color-danger)', fontSize: '1.1rem', padding: '0.2rem',
                                    opacity: items.length === 1 ? 0.3 : 1,
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* Totals */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Subtotal</span>
                            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, minWidth: 100, textAlign: 'right' }}>
                                {fmt(subtotal)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Discount (₹)</span>
                            <input
                                type="number"
                                value={discount}
                                min="0"
                                step="0.01"
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                className="form-input"
                                style={{ width: 100, textAlign: 'right', fontSize: '0.875rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', borderTop: '2px solid var(--color-border)', paddingTop: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
                            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: '1.1rem', minWidth: 100, textAlign: 'right', color: 'var(--color-danger)' }}>
                                {fmt(totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── Notes ─── */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="remarks">Remarks / Notes</label>
                        <textarea
                            id="remarks"
                            className="form-textarea"
                            rows={2}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Any notes for this invoice…"
                        />
                    </div>
                </div>

                {/* ─── Submit ─── */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <Link href="/invoices" className="btn btn-secondary">Cancel</Link>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Creating…' : `Create Invoice → ${fmt(totalAmount)}`}
                    </button>
                </div>
            </form>
        </>
    )
}
