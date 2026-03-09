import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDateTime } from '@/lib/utils'

export default async function AuditLogPage() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')

    const logs = await prisma.auditLog.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { performedAt: 'desc' },
        take: 200,
    })

    const actionBadge = { CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-red' }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Audit Log</h1>
                    <p className="text-muted">All key changes recorded for accountability</p>
                </div>
            </div>

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
                                    No audit logs yet.
                                </td>
                            </tr>
                        )}
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td className="text-muted" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                    {formatDateTime(log.performedAt)}
                                </td>
                                <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.user.name}</td>
                                <td>
                                    <span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>{log.entity}</span>
                                </td>
                                <td>
                                    <span className={`badge ${actionBadge[log.action as 'CREATE' | 'UPDATE' | 'DELETE'] ?? 'badge-gray'}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.78rem', maxWidth: 300 }}>
                                    {log.newValues && (
                                        <details>
                                            <summary style={{ cursor: 'pointer', color: 'var(--color-muted)' }}>View changes</summary>
                                            <pre style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.25rem', overflow: 'auto', maxHeight: 120 }}>
                                                {JSON.stringify(log.newValues, null, 2)}
                                            </pre>
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
