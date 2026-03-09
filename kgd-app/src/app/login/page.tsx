'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
        })

        setLoading(false)

        if (result?.error) {
            setError('Invalid email or password. Please try again.')
        } else {
            router.replace('/dashboard')
        }
    }

    return (
        <div className="login-bg">
            <div className="login-card">
                {/* Logo / Branding */}
                <div className="login-logo">
                    <h1>
                        KGD <span style={{ color: 'var(--color-primary)' }}>Accounts</span>
                    </h1>
                    <p>Paper Plate Manufacturing — Business Tracker</p>
                </div>

                {/* Error */}
                {error && <div className="alert alert-error">{error}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.75rem' }}
                    >
                        {loading ? 'Signing in…' : 'Sign In →'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                    KGD Business Tracker · Internal Use Only
                </p>
            </div>
        </div>
    )
}
