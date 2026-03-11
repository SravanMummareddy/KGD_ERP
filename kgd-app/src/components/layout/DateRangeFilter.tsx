'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

interface Props {
    paramKey?: string
}

export default function DateRangeFilter({ paramKey = 'range' }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()

    const currentRange = searchParams.get(paramKey) || ''
    const fromParam = searchParams.get('from') || ''
    const toParam = searchParams.get('to') || ''
    const isCustom = currentRange === 'custom' || (fromParam && toParam)

    function setRange(range: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (range === 'all') {
            params.delete(paramKey)
            params.delete('from')
            params.delete('to')
        } else if (range === 'custom') {
            params.set(paramKey, 'custom')
        } else {
            params.set(paramKey, range)
            params.delete('from')
            params.delete('to')
        }
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }

    function setCustomRange(from: string, to: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        params.set(paramKey, 'custom')
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }

    const btnBase: React.CSSProperties = {
        padding: '0.35rem 0.85rem',
        border: '1px solid var(--color-border)',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 500,
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        transition: 'all 0.15s',
    }
    const btnActive: React.CSSProperties = {
        ...btnBase,
        background: 'var(--color-primary)',
        color: 'white',
        borderColor: 'var(--color-primary)',
    }

    const activeRange = isCustom ? 'custom' : currentRange

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>Filter:</span>
            {[
                { label: 'All', value: 'all' },
                { label: 'Today', value: '1' },
                { label: '7 Days', value: '7' },
                { label: '30 Days', value: '30' },
                { label: 'Custom', value: 'custom' },
            ].map(({ label, value }) => (
                <button
                    key={value}
                    type="button"
                    style={activeRange === value || (value === 'all' && !activeRange) ? btnActive : btnBase}
                    onClick={() => setRange(value)}
                >
                    {label}
                </button>
            ))}

            {isCustom && (
                <>
                    <input
                        type="date"
                        className="form-input"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', maxWidth: 140 }}
                        defaultValue={fromParam}
                        onChange={(e) => setCustomRange(e.target.value, toParam)}
                    />
                    <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>to</span>
                    <input
                        type="date"
                        className="form-input"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', maxWidth: 140 }}
                        defaultValue={toParam}
                        onChange={(e) => setCustomRange(fromParam, e.target.value)}
                    />
                </>
            )}
        </div>
    )
}
