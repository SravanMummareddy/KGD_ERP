import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createUser } from '@/actions/users'

export default async function NewUserPage() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard')

    return (
        <div className="page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">New User</h1>
                    <p className="page-subtitle">Create a new staff or admin account</p>
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
                    <form action={createUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Full Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <input name="name" type="text" className="form-input" placeholder="e.g. Ravi Kumar" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <input name="email" type="email" className="form-input" placeholder="ravi@kgd.com" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <select name="role" className="form-input" defaultValue="STAFF">
                                <option value="STAFF">Staff — can create invoices & payments</option>
                                <option value="ADMIN">Admin — full access including user management</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <input name="password" type="password" className="form-input" placeholder="Minimum 8 characters" minLength={8} required />
                        </div>

                        <div className="alert alert-info" style={{ marginTop: '0.25rem' }}>
                            The user will use this email and password to log in. Share credentials securely.
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <Link href="/admin/users" className="btn btn-secondary">Cancel</Link>
                            <button type="submit" className="btn btn-primary">Create User</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
