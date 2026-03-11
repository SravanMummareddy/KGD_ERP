import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import DateRangeFilter from '@/components/layout/DateRangeFilter'
import { Suspense } from 'react'

function getDateRange(range: string|null, from: string|null, to: string|null) {
    const now = new Date()
    if (range === 'custom' && from && to) {
        return { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
    }
    const days = parseInt(range ?? '0')
    if (!days) return undefined
    const start = new Date(now)
    start.setDate(start.getDate() - days + 1)
    start.setHours(0, 0, 0, 0)
    return { gte: start }
}

const ENTITIES = ['Customer', 'Invoice', 'Payment', 'Product', 'Inventory']
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'CANCEL']

export default async function AuditLogPage({
    searchParams,
}: {
    searchParams: Promise<{ range?: string; from?: string; to?: string; entity?: string; action?: string; q?: string }>
}) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')

    const sp = await searchParams
    const dateFilter = getDateRange(sp.range ?? null, sp.from ?? null, sp.to ?? null)

    const logs = await prisma.auditLog.findMany({
        include: { user: { select: { name: true } } },
        where: {
            ...(dateFilter ? { performedAt: dateFilter } : {}),
            ...(sp.entity ? { entity: sp.entity } : {}),
            ...(sp.action ? { action: sp.action } : {}),
            ...(sp.q ? {
                OR: [
                    { entity: { contains: sp.q, mode: 'insensitive' } },
                    { action: { contains: sp.q, mode: 'insensitive' } },
                    { entityId: { contains: sp.q, mode: 'insensitive' } },
                ]
            } : {}),
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

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Audit Log</h1>
                    <p className="text-muted">All key changes recorded — {logs.length} entries shown</p>
                </div>
            </div>

            {/* Filters */}
            <form method="GET" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '0.25rem' }}>Entity</label>
                    <select name="entity" className="form-input" style={{ minWidth: 140 }} defaultValue={sp.entity ?? ''}>
                        <option value="">All Entities</option>
                        {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '0.25rem' }}>Action</label>
                    <select name="action" className="form-input" style={{ minWidth: 130 }} defaultValue={sp.action ?? ''}>
                        <option value="">All Actions</option>
                        {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '0.25rem' }}>Search</label>
                    <input name="q" type="text" className="form-input" placeholder="Search…" defaultValue={sp.q ?? ''} style={{ minWidth: 180 }} />
                </div>
                <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>Filter</button>
                <a href="/audit" className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>Clear</a>
            </form>

            <Suspense>
                <DateRangeFilter />
            </Suspense>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date / Time</th>
                            <th>User</th>
                            <th>Entity</th>
                            <th>Action</th>
                            <th>Changes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                                    No audit logs match this filter.
                                </td>
                            </tr>
                        )}
                        {logs.map((log: LogRow) => (
                            <tr key={log.id}>
                                <td className="text-muted" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
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
                                <td style={{ fontSize: '0.78rem', maxWidth: 300 }}>
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}
