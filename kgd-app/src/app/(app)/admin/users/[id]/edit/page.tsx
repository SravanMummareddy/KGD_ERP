import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updateUser } from '@/actions/users'

export default async function EditUserPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')

    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) redirect('/admin/users')

    const isSelf = user.id === session.user.id

    const boundAction = updateUser.bind(null, id)

    return (
        <div className="page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Edit User</h1>
                    <p className="page-subtitle">{user.name}</p>
                </div>
                <Link href="/admin/users" className="btn btn-secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Users
                </Link>
            </div>

            <div style={{ maxWidth: 520 }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <form action={boundAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Full Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <input name="name" type="text" className="form-input" defaultValue={user.name} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <input name="email" type="email" className="form-input" defaultValue={user.email} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select name="role" className="form-input" defaultValue={user.role} disabled={isSelf}>
                                <option value="STAFF">Staff — can create invoices & payments</option>
                                <option value="ADMIN">Admin — full access including user management</option>
                            </select>
                            {isSelf && (
                                <>
                                    <input type="hidden" name="role" value={user.role} />
                                    <p className="text-muted text-xs" style={{ marginTop: '0.25rem' }}>You cannot change your own role.</p>
                                </>
                            )}
                        </div>

                        <hr className="divider" />

                        <div className="form-group">
                            <label className="form-label">New Password <span className="text-muted" style={{ fontSize: '0.78rem', fontWeight: 400 }}>(leave blank to keep current)</span></label>
                            <input name="newPassword" type="password" className="form-input" placeholder="Minimum 8 characters" />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <Link href="/admin/users" className="btn btn-secondary">Cancel</Link>
                            <button type="submit" className="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
