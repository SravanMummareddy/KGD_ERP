import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import { Suspense } from 'react'
import ColumnFilter from '@/components/layout/ColumnFilter'
import DateDropdownFilter from '@/components/layout/DateDropdownFilter'

function getDateRange(range: string | null, from: string | null, to: string | null) {
    const now = new Date()
    if (from && to) {
        return { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
    }
    if (range === 'month') {
        return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    }
    const days = parseInt(range ?? '0')
    if (!days) return undefined
    const start = new Date(now)
    start.setDate(start.getDate() - days + 1)
    start.setHours(0, 0, 0, 0)
    return { gte: start }
}

const ENTITY_OPTIONS = [
    { value: 'Customer', label: 'Customer' },
    { value: 'Invoice', label: 'Invoice' },
    { value: 'Payment', label: 'Payment' },
    { value: 'Product', label: 'Product' },
    { value: 'Inventory', label: 'Inventory' },
]

const ACTION_OPTIONS = [
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'CANCEL', label: 'Cancel' },
]

export default async function AuditLogPage({
    searchParams,
}: {
    searchParams: Promise<{
        range?: string; from?: string; to?: string
        entity?: string | string[]
        action?: string | string[]
    }>
}) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')

    const sp = await searchParams
    const dateFilter = getDateRange(sp.range ?? null, sp.from ?? null, sp.to ?? null)

    const entityFilter = sp.entity
        ? (Array.isArray(sp.entity) ? sp.entity : [sp.entity])
        : []
    const actionFilter = sp.action
        ? (Array.isArray(sp.action) ? sp.action : [sp.action])
        : []

    const logs = await prisma.auditLog.findMany({
        include: { user: { select: { name: true } } },
        where: {
            ...(dateFilter ? { performedAt: dateFilter } : {}),
            ...(entityFilter.length > 0 ? { entity: { in: entityFilter } } : {}),
            ...(actionFilter.length > 0 ? { action: { in: actionFilter } } : {}),
        },
        orderBy: { performedAt: 'desc' },
        take: 300,
    })

    type LogRow = typeof logs[number]
    const actionBadge: Record<string, string> = {
        CREATE: 'badge-green',
        UPDATE: 'badge-blue',
        DELETE: 'badge-red',
        CANCEL: 'badge-amber',
    }

    const hasFilter = entityFilter.length > 0 || actionFilter.length > 0 || sp.range || sp.from

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Audit Log</h1>
                    <p className="text-muted">{logs.length} entries shown</p>
                </div>
                {hasFilter && (
                    <a href="/audit" className="btn btn-secondary">✕ Clear all filters</a>
                )}
            </div>

            {/* Date filter row */}
            <div style={{ marginBottom: '0.75rem' }}>
                <Suspense>
                    <DateDropdownFilter />
                </Suspense>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ minWidth: 160 }}>Date / Time</th>
                            <th>User</th>
                            <th>
                                <Suspense fallback="Entity">
                                    <ColumnFilter column="entity" label="Entity" options={ENTITY_OPTIONS} paramKey="entity" />
                                </Suspense>
                            </th>
                            <th>
                                <Suspense fallback="Action">
                                    <ColumnFilter column="action" label="Action" options={ACTION_OPTIONS} paramKey="action" />
                                </Suspense>
                            </th>
                            <th>Changes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No audit logs match this filter.{' '}
                                    {hasFilter && <a href="/audit">Clear filters</a>}
                                </td>
                            </tr>
                        )}
                        {logs.map((log: LogRow) => (
                            <tr key={log.id}>
                                <td className="text-muted" style={{ fontSize: '0.8rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                    {formatDateTime(log.performedAt)}
                                </td>
                                <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.user.name}</td>
                                <td>
                                    <span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>{log.entity}</span>
                                </td>
                                <td>
                                    <span className={`badge ${actionBadge[log.action] ?? 'badge-gray'}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.78rem', maxWidth: 320 }}>
                                    {(log.oldValues || log.newValues) && (
                                        <details>
                                            <summary style={{ cursor: 'pointer', color: 'var(--color-muted)' }}>View changes</summary>
                                            {log.oldValues && (
                                                <pre style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '0.25rem', overflow: 'auto', maxHeight: 80 }}>
                                                    Before: {JSON.stringify(log.oldValues, null, 2)}
                                                </pre>
                                            )}
                                            {log.newValues && (
                                                <pre style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', background: '#f0fdf4', padding: '0.5rem', borderRadius: '0.25rem', overflow: 'auto', maxHeight: 80 }}>
                                                    After: {JSON.stringify(log.newValues, null, 2)}
                                                </pre>
                                            )}
                                        </details>
                                    )}
                                    {!log.oldValues && !log.newValues && (
                                        <span className="text-muted">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}
