'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useRef, useEffect, useState } from 'react'

interface FilterOption {
    value: string
    label: string
}

interface Props {
    column: string
    label: string
    options: FilterOption[]
    paramKey: string
}

/**
 * Excel-style column header filter dropdown.
 * Renders a 🔽 button in the table header. Clicking opens a small dropdown
 * with checkboxes. Applies selection to URL search params.
 */
export default function ColumnFilter({ column, label, options, paramKey }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const currentValues = searchParams.getAll(paramKey)
    const hasFilter = currentValues.length > 0

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    function toggleValue(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        const existing = params.getAll(paramKey)
        params.delete(paramKey)
        if (existing.includes(value)) {
            // remove it
            existing.filter((v) => v !== value).forEach((v) => params.append(paramKey, v))
        } else {
            // add it
            [...existing, value].forEach((v) => params.append(paramKey, v))
        }
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }

    function clearFilter() {
        const params = new URLSearchParams(searchParams.toString())
        params.delete(paramKey)
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
        setOpen(false)
    }

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>{label}</span>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title={`Filter by ${label}`}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontSize: '0.7rem',
                    color: hasFilter ? 'var(--color-primary)' : 'var(--color-muted)',
                    fontWeight: hasFilter ? 700 : 400,
                    lineHeight: 1,
                    backgroundColor: hasFilter ? 'var(--color-primary-light, #dbeafe)' : 'transparent',
                }}
            >
                {hasFilter ? `▼ (${currentValues.length})` : '▼'}
            </button>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    zIndex: 9999,
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                    minWidth: 195,
                    maxHeight: 280,
                    overflowY: 'auto',
                    padding: '0.4rem 0',
                }}>
                    <div style={{ padding: '0.25rem 0.75rem 0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Filter: {label}
                        </span>
                    </div>
                    {options.map((opt) => {
                        const checked = currentValues.includes(opt.value)
                        return (
                            <label key={opt.value} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.4rem 0.75rem', cursor: 'pointer',
                                background: checked ? 'var(--color-primary-light, #eff6ff)' : 'transparent',
                                fontSize: '0.85rem',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleValue(opt.value)}
                                />
                                {opt.label}
                            </label>
                        )
                    })}
                    {hasFilter && (
                        <button
                            type="button"
                            onClick={clearFilter}
                            style={{
                                display: 'block', width: '100%', padding: '0.4rem 0.75rem',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--color-danger)', fontSize: '0.8rem', textAlign: 'left',
                                borderTop: '1px solid var(--color-border)', marginTop: '0.25rem',
                            }}
                        >
                            ✕ Clear filter
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
