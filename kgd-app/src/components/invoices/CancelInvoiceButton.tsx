'use client'

import { useState } from 'react'
import { cancelInvoice } from '@/actions/invoices'

export default function CancelInvoiceButton({ invoiceId }: { invoiceId: string }) {
    const [showModal, setShowModal] = useState(false)
    const [confirming, setConfirming] = useState(false)

    async function handleConfirm() {
        setConfirming(true)
        try {
            await cancelInvoice(invoiceId)
        } catch (e) {
            console.error(e)
            setConfirming(false)
            setShowModal(false)
        }
    }

    return (
        <>
            <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setShowModal(true)}
            >
                Cancel Invoice
            </button>

            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div className="card" style={{ maxWidth: 420, width: '90%', padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-danger)' }}>
                            ⚠️ Cancel Invoice?
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            This will mark the invoice as <strong>CANCELLED</strong>, reverse all payment allocations,
                            and return any payments to the customer&apos;s credit balance.
                            <br /><br />
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowModal(false)}
                                disabled={confirming}
                            >
                                Continue Editing
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleConfirm}
                                disabled={confirming}
                            >
                                {confirming ? 'Cancelling…' : 'Yes, Cancel Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
