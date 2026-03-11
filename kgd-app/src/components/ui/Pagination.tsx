'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export default function Pagination({
    totalPages,
    currentPage,
}: {
    totalPages: number
    currentPage: number
}) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', pageNumber.toString())
        return `${pathname}?${params.toString()}`
    }

    if (totalPages <= 1) return null

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.85rem'
        }}>
            <Link
                href={createPageURL(currentPage - 1)}
                className={`btn btn-secondary btn-sm ${currentPage <= 1 ? 'disabled' : ''}`}
                style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto', opacity: currentPage <= 1 ? 0.5 : 1 }}
            >
                ← Prev
            </Link>

            <span className="text-muted" style={{ fontWeight: 500 }}>
                Page {currentPage} of {totalPages}
            </span>

            <Link
                href={createPageURL(currentPage + 1)}
                className={`btn btn-secondary btn-sm ${currentPage >= totalPages ? 'disabled' : ''}`}
                style={{ pointerEvents: currentPage >= totalPages ? 'none' : 'auto', opacity: currentPage >= totalPages ? 0.5 : 1 }}
            >
                Next →
            </Link>
        </div>
    )
}
