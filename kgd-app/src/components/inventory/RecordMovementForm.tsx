'use client'

import { useState } from 'react'
import { addInventoryTransaction } from '@/actions/inventory'
import { adjustStock } from '@/actions/products'
import { useFormStatus } from 'react-dom'

type ItemRow = {
    id: string
    name: string
    currentStock: number | string | any
    unit: string
}

type ProductRow = {
    id: string
    name: string
    stockPieces: number
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={pending}>
            {pending ? 'Recording...' : 'Record Movement'}
        </button>
    )
}

export default function RecordMovementForm({ 
    items, 
    products 
}: { 
    items: ItemRow[]
    products: ProductRow[] 
}) {
    const [mode, setMode] = useState<'RAW' | 'FINISHED'>('RAW')
    const [error, setError] = useState<string | null>(null)

    async function handleFinishedSubmit(formData: FormData) {
        setError(null)
        try {
            const productId = formData.get('productId') as string
            const type = formData.get('type') as 'IN' | 'OUT'
            const packets = parseInt(formData.get('packets') as string) || 0
            const loose = parseInt(formData.get('loose') as string) || 0
            const reason = formData.get('notes') as string

            if (!productId) throw new Error('Item is required')
            if (packets === 0 && loose === 0) throw new Error('Quantity is required')
            
            await adjustStock(productId, type, packets, loose, reason || 'Inventory Adjust')
            // Optionally clear form here or let the user do it
        } catch (err: any) {
            setError(err.message || 'Error updating stock')
        }
    }

    return (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Record Stock Movement</h2>
            
            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button 
                    type="button" 
                    onClick={() => setMode('RAW')}
                    style={{ 
                        flex: 1, 
                        padding: '0.5rem', 
                        borderRadius: '0.375rem', 
                        border: '1px solid var(--color-border)', 
                        background: mode === 'RAW' ? 'var(--color-primary)' : 'transparent',
                        color: mode === 'RAW' ? 'white' : 'var(--color-text)',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                    }}
                >
                    Raw Material
                </button>
                <button 
                    type="button" 
                    onClick={() => setMode('FINISHED')}
                    style={{ 
                        flex: 1, 
                        padding: '0.5rem', 
                        borderRadius: '0.375rem', 
                        border: '1px solid var(--color-border)', 
                        background: mode === 'FINISHED' ? 'var(--color-primary)' : 'transparent',
                        color: mode === 'FINISHED' ? 'white' : 'var(--color-text)',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                    }}
                >
                    Finished Goods
                </button>
            </div>

            {error && <div className="text-danger" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

            {mode === 'RAW' ? (
                <form action={async (fd) => {
                    setError(null);
                    try {
                        await addInventoryTransaction(fd);
                    } catch (err: any) {
                        setError(err.message || 'Error recording movement');
                    }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label className="form-label">Raw Material *</label>
                        <select name="inventoryItemId" className="form-select" required>
                            <option value="">— Select item —</option>
                            {items.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({Number(item.currentStock).toFixed(2)} {item.unit})
                                </option>
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
                    <SubmitButton />
                </form>
            ) : (
                <form action={handleFinishedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                     <div className="form-group">
                        <label className="form-label">Finished Product *</label>
                        <select name="productId" className="form-select" required>
                            <option value="">— Select unit —</option>
                            {products.map((p) => {
                                const packets = Math.floor(p.stockPieces / 14);
                                const loose = p.stockPieces % 14;
                                const stockLabel = `${packets} Pkts${loose > 0 ? ` + ${loose} Loose` : ''}`;
                                return (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({stockLabel})
                                </option>
                                )
                            })}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Movement Type *</label>
                        <select name="type" className="form-select">
                            <option value="IN">Production Yield (IN)</option>
                            <option value="OUT">Manual Adjustment (OUT)</option>
                        </select>
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Packets *</label>
                            <input name="packets" type="number" min="0" defaultValue="0" className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Loose / Pieces</label>
                            <input name="loose" type="number" min="0" defaultValue="0" className="form-input" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Reason / Notes</label>
                        <input name="notes" type="text" className="form-input" placeholder="e.g. Yield from daily run" />
                    </div>
                    <SubmitButton />
                </form>
            )}
        </div>
    )
}
