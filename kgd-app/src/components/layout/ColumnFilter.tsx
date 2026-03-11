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
                <div 
                    className="absolute z-[9999] top-full mt-2 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden text-left font-normal text-gray-800"
                    style={{ maxHeight: '320px', overflowY: 'auto' }}
                >
                    <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Filter: {label}
                        </span>
                    </div>
                    <div className="py-1">
                        {options.map((opt) => {
                            const checked = currentValues.includes(opt.value)
                            return (
                                <label 
                                    key={opt.value} 
                                    className={`flex items-start gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors ${
                                        checked ? 'bg-blue-50/80 hover:bg-blue-50' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleValue(opt.value)}
                                        className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                    <span className={`block flex-1 ${checked ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                        {opt.label}
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                    {hasFilter && (
                        <div className="border-t border-gray-100 p-1">
                            <button
                                type="button"
                                onClick={clearFilter}
                                className="w-full text-left px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors flex items-center gap-1.5"
                            >
                                <span>✕</span>
                                Clear filter
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
