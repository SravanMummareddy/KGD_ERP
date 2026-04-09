import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import ToggleActiveButton from '@/components/admin/ToggleActiveButton'

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')

    const sp = await searchParams
    const showInactive = sp.status === 'inactive'

    const users = await prisma.user.findMany({
        where: showInactive ? { isActive: false } : { isActive: true },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
    })

    const totalActive = await prisma.user.count({ where: { isActive: true } })
    const totalInactive = await prisma.user.count({ where: { isActive: false } })

    return (
        <div className="page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">{totalActive} active · {totalInactive} inactive</p>
                </div>
                <Link href="/admin/users/new" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.9rem', height: '0.9rem' }}>
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New User
                </Link>
            </div>

            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem' }}>
                <Link
                    href="/admin/users"
                    className={`btn btn-sm ${!showInactive ? 'btn-primary' : 'btn-secondary'}`}
                >
                    Active ({totalActive})
                </Link>
                <Link
                    href="/admin/users?status=inactive"
                    className={`btn btn-sm ${showInactive ? 'btn-primary' : 'btn-secondary'}`}
                >
                    Inactive ({totalInactive})
                </Link>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '44px' }}>#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th style={{ width: '160px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={7}>
                                    <div className="empty-state">
                                        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <p className="empty-state-title">No {showInactive ? 'inactive' : 'active'} users</p>
                                        <p className="empty-state-desc">{showInactive ? 'All users are currently active.' : 'Create a user to get started.'}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {users.map((user: typeof users[number], i: number) => {
                            const isSelf = user.id === session.user.id
                            return (
                                <tr key={user.id}>
                                    <td className="text-muted text-xs">{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>
                                        {user.name}
                                        {isSelf && <span className="badge badge-blue" style={{ marginLeft: '0.375rem', fontSize: '0.65rem' }}>You</span>}
                                    </td>
                                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.role === 'ADMIN' ? 'badge-amber' : 'badge-gray'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                                        {formatDateTime(user.createdAt)}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <Link href={`/admin/users/${user.id}/edit`} className="btn btn-ghost btn-icon" title="Edit user">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </Link>
                                            {!isSelf && (
                                                <ToggleActiveButton
                                                    userId={user.id}
                                                    isActive={user.isActive}
                                                    userName={user.name}
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
