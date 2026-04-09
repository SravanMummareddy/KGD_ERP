'use client'

import { useState, useTransition } from 'react'
import { useToast } from './ToastProvider'

interface DeleteButtonProps {
    action: () => Promise<{ error?: string }>
    title?: string
    message: string
    warningMessage?: string
    buttonLabel?: string
    buttonClassName?: string
    confirmLabel?: string
    iconOnly?: boolean  // renders a compact trash icon button
}

export default function DeleteButton({
    action,
    title = 'Confirm Delete',
    message,
    warningMessage,
    buttonLabel = 'Delete',
    buttonClassName = 'btn btn-danger btn-sm',
    confirmLabel = 'Delete',
    iconOnly = false,
}: DeleteButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { addToast } = useToast()

    const handleConfirm = () => {
        startTransition(async () => {
            const result = await action()
            if (result?.error) {
                addToast('error', result.error)
                setIsOpen(false)
            } else {
                addToast('success', 'Deleted successfully — moved to Recycle Bin')
                setIsOpen(false)
            }
        })
    }

    return (
        <>
            {iconOnly ? (
                <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => setIsOpen(true)}
                    title={title}
                    style={{ color: 'var(--color-danger)' }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                </button>
            ) : (
                <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => setIsOpen(true)}
                >
                    {buttonLabel}
                </button>
            )}

            {isOpen && (
                <div className="modal-overlay" onClick={() => !isPending && setIsOpen(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.1rem', height: '1.1rem', color: 'var(--color-danger)' }}>
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                    <path d="M10 11v6M14 11v6" />
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                                {title}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="btn btn-ghost btn-sm"
                                disabled={isPending}
                                style={{ padding: '0.25rem' }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: warningMessage ? '0.75rem' : 0 }}>
                                {message}
                            </p>
                            {warningMessage && (
                                <div className="alert alert-warning" style={{ fontSize: '0.83rem' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }}>
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    {warningMessage}
                                </div>
                            )}
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.75rem' }}>
                                This will move the item to the Recycle Bin. You can restore it from Admin → Deleted Items.
                            </p>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)} disabled={isPending}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleConfirm} disabled={isPending}>
                                {isPending ? 'Deleting…' : confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
