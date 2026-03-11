'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useState } from 'react'

const PRESETS = [
    { label: 'All time', value: '' },
    { label: 'Today', value: '1' },
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'This month', value: 'month' },
    { label: 'Custom range…', value: 'custom' },
]

interface Props {
    /** URL param for the range preset, defaults to "range" */
    rangeParam?: string
    /** Additional params to preserve when applying date filter */
    preserveParams?: string[]
}

export default function DateDropdownFilter({ rangeParam = 'range', preserveParams = [] }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()

    const currentRange = searchParams.get(rangeParam) ?? ''
    const currentFrom = searchParams.get('from') ?? ''
    const currentTo = searchParams.get('to') ?? ''

    // If from/to set without a preset, show "Custom range…" as active
    const selectValue = currentFrom ? 'custom' : currentRange

    const [showCustom, setShowCustom] = useState(selectValue === 'custom')
    const [from, setFrom] = useState(currentFrom)
    const [to, setTo] = useState(currentTo)

    function buildParams(overrides: Record<string, string>) {
        const params = new URLSearchParams(searchParams.toString())
        // Clear date params first
        params.delete(rangeParam)
        params.delete('from')
        params.delete('to')
        for (const [k, v] of Object.entries(overrides)) {
            if (v) params.set(k, v)
        }
        return params.toString()
    }

    function onPresetChange(value: string) {
        if (value === 'custom') {
            setShowCustom(true)
            return
        }
        setShowCustom(false)
        startTransition(() => {
            router.push(`${pathname}?${buildParams({ [rangeParam]: value })}`)
        })
    }

    function applyCustom() {
        if (!from || !to) return
        startTransition(() => {
            router.push(`${pathname}?${buildParams({ from, to })}`)
        })
    }

    const isActive = currentRange || currentFrom

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 600 }}>Date:</span>
            <select
                value={selectValue}
                onChange={(e) => onPresetChange(e.target.value)}
                className="form-select"
                style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.6rem',
                    height: 'auto',
                    minWidth: 145,
                    fontWeight: selectValue ? 600 : 400,
                    color: selectValue ? 'var(--color-primary)' : undefined,
                    border: selectValue ? '1.5px solid var(--color-primary)' : undefined,
                }}
            >
                {PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                ))}
            </select>

            {(showCustom || selectValue === 'custom') && (
                <>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="form-input"
                        style={{ maxWidth: 135, padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>→</span>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="form-input"
                        style={{ maxWidth: 135, padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                    />
                    <button
                        type="button"
                        onClick={applyCustom}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                        disabled={!from || !to}
                    >
                        Apply
                    </button>
                </>
            )}

            {isActive && (
                <button
                    type="button"
                    onClick={() => {
                        setShowCustom(false)
                        setFrom('')
                        setTo('')
                        startTransition(() => router.push(`${pathname}?${buildParams({})}`))
                    }}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-danger)', fontSize: '0.78rem', padding: '0 0.2rem',
                    }}
                    title="Clear date filter"
                >
                    ✕
                </button>
            )}
        </div>
    )
}
