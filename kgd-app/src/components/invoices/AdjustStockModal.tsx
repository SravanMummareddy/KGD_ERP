'use client'

import { useState } from 'react'
import { adjustStock } from '@/actions/products'

export default function AdjustStockModal({ 
    productId, 
    productName, 
    currentStock 
}: { 
    productId: string
    productName: string
    currentStock: number 
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [packets, setPackets] = useState('')
    const [loose, setLoose] = useState('')
    const [reason, setReason] = useState('New Production')
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)

        const p = parseInt(packets) || 0
        const l = parseInt(loose) || 0
        
        if (p === 0 && l === 0) {
            setIsSubmitting(false)
            return
        }

        try {
            await adjustStock(productId, 'IN', p, l, reason)
            setIsOpen(false)
            setPackets('')
            setLoose('')
        } catch (error) {
            console.error('Failed to adjust stock:', error)
            alert('Failed to update stock')
        } finally {
            setIsSubmitting(false)
        }
    }

    const currentPackets = Math.floor(currentStock / 14)
    const currentLoose = currentStock % 14

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)} 
                className="btn btn-secondary btn-sm"
            >
                Add Stock
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.2s ease-out' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                            Add Stock: {productName}
                        </h3>
                        
                        <p className="text-muted" style={{ marginBottom: '1rem' }}>
                            Current: {currentPackets} Packets, {currentLoose} Loose
                        </p>

                        <form onSubmit={handleSubmit} className="form-group" style={{ gap: '1rem' }}>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Packets (14 pcs)</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={packets} 
                                        onChange={e => setPackets(e.target.value)} 
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Loose Plates</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={loose} 
                                        onChange={e => setLoose(e.target.value)} 
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Reason / Notes</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={reason} 
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="e.g. New Production Run"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Stock'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
