'use client'

import { useState } from 'react'
import { addInventoryItem } from '@/actions/inventory'
import { createProduct } from '@/actions/products'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" className="btn btn-secondary" style={{ justifyContent: 'center' }} disabled={pending}>
            {pending ? 'Adding...' : 'Add Item'}
        </button>
    )
}

export default function AddNewItemForm() {
    const [mode, setMode] = useState<'RAW' | 'FINISHED'>('RAW')
    const [error, setError] = useState<string | null>(null)

    async function handleFinishedSubmit(formData: FormData) {
        setError(null)
        try {
            await createProduct(formData)
            // It redirects on success, or throws error
        } catch (err: any) {
            setError(err.message || 'Error creating product')
        }
    }

    async function handleRawSubmit(formData: FormData) {
        setError(null)
        try {
            await addInventoryItem(formData)
        } catch (err: any) {
            setError(err.message || 'Error creating item')
        }
    }

    return (
        <div className="card">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Add New Item</h2>
            
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
                    Finished Good
                </button>
            </div>

            {error && <div className="text-danger" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

            {mode === 'RAW' ? (
                <form action={handleRawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label className="form-label">Material Name *</label>
                        <input name="name" type="text" className="form-input" placeholder="e.g. Brown Paper 700mm 80 GSM" required />
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <input name="category" type="text" className="form-input" placeholder="General" list="inv-cats" />
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
                    <SubmitButton />
                </form>
            ) : (
                <form action={handleFinishedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                     <div className="form-group">
                        <label className="form-label">Product Name *</label>
                        <input name="name" type="text" className="form-input" placeholder="e.g. 10 inch Plate" required />
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select name="type" className="form-select">
                                <option value="PLATE">Plate</option>
                                <option value="SHEET">Sheet</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Size (Inches)</label>
                            <input name="sizeInches" type="number" step="0.1" min="0" className="form-input" placeholder="e.g. 10" />
                        </div>
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">GSM</label>
                            <input name="gsm" type="number" step="1" min="0" className="form-input" placeholder="e.g. 80" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Default Rate (₹)</label>
                            <input name="defaultRate" type="number" step="0.01" min="0" className="form-input" />
                        </div>
                    </div>
                    <SubmitButton />
                </form>
            )}
        </div>
    )
}
