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

    const createPageURL = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', pageNumber.toString())
        return `${pathname}?${params.toString()}`
    }

    if (totalPages <= 1) return null

    // Build page number range to show
    const delta = 2
    const range: (number | 'ellipsis')[] = []
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            range.push(i)
        } else if (range[range.length - 1] !== 'ellipsis') {
            range.push('ellipsis')
        }
    }

    return (
        <div className="pagination">
            {/* Prev */}
            {currentPage <= 1 ? (
                <span className="page-btn disabled">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Prev
                </span>
            ) : (
                <Link href={createPageURL(currentPage - 1)} className="page-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Prev
                </Link>
            )}

            {/* Page numbers */}
            {range.map((item, idx) =>
                item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="pagination-info" style={{ padding: '0 0.25rem' }}>…</span>
                ) : (
                    item === currentPage ? (
                        <span key={item} className="page-btn active">{item}</span>
                    ) : (
                        <Link key={item} href={createPageURL(item)} className="page-btn">{item}</Link>
                    )
                )
            )}

            {/* Next */}
            {currentPage >= totalPages ? (
                <span className="page-btn disabled">
                    Next
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </span>
            ) : (
                <Link href={createPageURL(currentPage + 1)} className="page-btn">
                    Next
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </Link>
            )}
        </div>
    )
}
