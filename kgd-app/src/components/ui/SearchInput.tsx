'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useRef, useTransition } from 'react'

export default function SearchInput({ placeholder = 'Search…', paramKey = 'q' }: { placeholder?: string; paramKey?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const currentValue = searchParams.get(paramKey) ?? ''

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams)
            if (value) {
                params.set(paramKey, value)
                params.delete('page')
            } else {
                params.delete(paramKey)
            }
            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`)
            })
        }, 350)
    }

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: '0.625rem', width: '0.875rem', height: '0.875rem', color: 'var(--color-muted)', pointerEvents: 'none' }}
            >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
                type="search"
                className="form-input"
                defaultValue={currentValue}
                onChange={handleChange}
                placeholder={placeholder}
                style={{ paddingLeft: '2rem', minWidth: 220, height: '2.1rem', fontSize: '0.875rem' }}
            />
            {isPending && (
                <div style={{ position: 'absolute', right: '0.625rem', width: '0.75rem', height: '0.75rem', border: '2px solid var(--color-muted)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            )}
        </div>
    )
}
