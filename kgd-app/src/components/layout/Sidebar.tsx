'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/customers', label: 'Customers', icon: '👥' },
    { href: '/invoices', label: 'Invoices', icon: '📄' },
    { href: '/payments', label: 'Payments', icon: '💰' },
    { href: '/products', label: 'Products', icon: '📦' },
    { href: '/inventory', label: 'Inventory', icon: '🏭' },
    { href: '/audit', label: 'Audit Log', icon: '🔍' },
]

export default function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
    const pathname = usePathname()

    return (
        <nav className="sidebar">
            {/* Brand */}
            <div className="sidebar-logo">
                <span>⚙</span> KGD <span>Accounts</span>
            </div>

            {/* Nav links */}
            <div className="sidebar-nav">
                <div className="nav-section-label">Main Menu</div>
                {navItems.map((item) => {
                    // Hide Audit Log for non-admins
                    if (item.href === '/audit' && userRole !== 'ADMIN') return null
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link${isActive ? ' active' : ''}`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
                <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem' }}>{userName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'capitalize' }}>
                        {userRole.toLowerCase()}
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{
                        background: 'none',
                        border: '1px solid #334155',
                        color: '#64748b',
                        cursor: 'pointer',
                        borderRadius: '0.375rem',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        width: '100%',
                    }}
                >
                    Sign Out
                </button>
            </div>
        </nav>
    )
}
