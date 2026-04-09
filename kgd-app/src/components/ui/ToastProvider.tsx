'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    message: string
}

interface ToastContextValue {
    addToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used inside ToastProvider')
    return ctx
}

function ToastIcon({ type }: { type: ToastType }) {
    if (type === 'success') return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem', flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
    if (type === 'error') return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    )
    if (type === 'warning') return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem', flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    )
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
}

const toastColors: Record<ToastType, { bg: string; border: string; color: string }> = {
    success: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    error:   { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#fcd34d', color: '#d97706' },
    info:    { bg: '#eff6ff', border: '#93c5fd', color: '#2563eb' },
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
        const timer = timers.current.get(id)
        if (timer) { clearTimeout(timer); timers.current.delete(id) }
    }, [])

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = `${Date.now()}-${Math.random()}`
        setToasts(prev => [...prev.slice(-4), { id, type, message }]) // max 5 toasts
        const timer = setTimeout(() => removeToast(id), 4500)
        timers.current.set(id, timer)
    }, [removeToast])

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}

            {/* Toast container */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxWidth: '360px',
                    width: '100%',
                    pointerEvents: 'none',
                }}
                aria-live="polite"
                aria-label="Notifications"
            >
                {toasts.map(toast => {
                    const colors = toastColors[toast.type]
                    return (
                        <div
                            key={toast.id}
                            role={toast.type === 'error' ? 'alert' : 'status'}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.625rem',
                                padding: '0.75rem 1rem',
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                                color: colors.color,
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                animation: 'slideUp 0.2s ease',
                                pointerEvents: 'auto',
                            }}
                        >
                            <ToastIcon type={toast.type} />
                            <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{ background: 'none', border: 'none', color: colors.color, cursor: 'pointer', padding: '0', opacity: 0.7, flexShrink: 0, lineHeight: 1 }}
                                aria-label="Dismiss"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}
