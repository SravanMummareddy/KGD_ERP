'use client'

import { useState } from 'react'
import { adjustStock } from '@/actions/products'
import { useToast } from '@/components/ui/ToastProvider'

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
    const { addToast } = useToast()

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
            addToast('success', `Stock updated for ${productName}`)
            setIsOpen(false)
            setPackets('')
            setLoose('')
        } catch (error) {
            console.error('Failed to adjust stock:', error)
            addToast('error', 'Failed to update stock. Please try again.')
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
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Stock — {productName}</h3>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.25rem' }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
                                Current stock: <strong>{currentPackets} Packets</strong>{currentLoose > 0 && `, ${currentLoose} Loose`}
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Packets (14 pcs)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={packets}
                                            onChange={e => setPackets(e.target.value)}
                                            placeholder="0"
                                            min="0"
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
                                            min="0"
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

                                <div className="modal-footer" style={{ padding: 0, marginTop: '0.5rem' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving…' : 'Save Stock'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
