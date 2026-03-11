'use client'

import { useState, useEffect } from 'react'
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
    const [isOpen, setIsOpen] = useState(false) // Mobile drawer
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false) // Desktop collapse

    // Close sidebar on route change automatically on mobile
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen && window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    return (
        <>
            {/* Mobile Topbar with Hamburger */}
            <div className="mobile-topbar">
                <button onClick={() => setIsOpen(true)} aria-label="Open Menu">
                    ☰
                </button>
                <div className="brand">
                    <span>⚙</span> KGD <span>Accounts</span>
                </div>
            </div>

            {/* Overlay for mobile drawing closing */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
            )}

            <nav className={`sidebar ${isOpen ? 'open' : ''} ${isDesktopCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-logo">
                    {/* Desktop Hamburger Toggle */}
                    <button 
                        onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                        style={{ background: 'none', border: 'none', color: '#f1f5f9', fontSize: '1.25rem', cursor: 'pointer', marginRight: '0.5rem' }}
                        className="desktop-toggle"
                        aria-label="Toggle Sidebar"
                    >
                        ☰
                    </button>
                    {!isDesktopCollapsed && (
                        <><span>⚙</span> KGD <span>Accounts</span></>
                    )}
                    {/* Close button inside sidebar on mobile */}
                    <button 
                        className="mobile-close" 
                        onClick={() => setIsOpen(false)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Nav links */}
                <div className="sidebar-nav">
                    {!isDesktopCollapsed && <div className="nav-section-label">Main Menu</div>}
                    {navItems.map((item) => {
                        // Hide Audit Log for non-admins
                        if (item.href === '/audit' && userRole !== 'ADMIN') return null
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-link${isActive ? ' active' : ''}`}
                                title={isDesktopCollapsed ? item.label : undefined} // Tooltip on hover if collapsed
                            >
                                <span>{item.icon}</span>
                                {!isDesktopCollapsed && item.label}
                            </Link>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="sidebar-footer">
                    {!isDesktopCollapsed && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem' }}>{userName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'capitalize' }}>
                                {userRole.toLowerCase()}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        title={isDesktopCollapsed ? "Sign Out" : undefined}
                        style={{
                            background: 'none',
                            border: '1px solid #334155',
                            color: '#e2e8f0', // Brighter icon color
                            cursor: 'pointer',
                            borderRadius: '0.375rem',
                            padding: isDesktopCollapsed ? '0.5rem' : '0.35rem 0.75rem',
                            fontSize: isDesktopCollapsed ? '1.2rem' : '0.78rem',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        {isDesktopCollapsed ? '🚪' : 'Sign Out'}
                    </button>
                </div>
            </nav>
        </>
    )
}
