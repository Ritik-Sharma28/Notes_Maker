import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/app/topics'
  const reason = searchParams.get('reason')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', letterSpacing: '-0.01em' }}>
        Sign in
      </h1>

      {reason === 'session_expired' && (
        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--muted-foreground)' }}>
          Your session ended. Sign in again to continue.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'var(--foreground)' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: '100%',
              height: '36px',
              padding: '0 12px',
              border: `1px solid ${error && !email ? 'var(--destructive)' : 'var(--input)'}`,
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={e => e.target.style.outline = '2px solid var(--ring)'}
            onBlur={e => e.target.style.outline = 'none'}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'var(--foreground)' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              height: '36px',
              padding: '0 12px',
              border: '1px solid var(--input)',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={e => e.target.style.outline = '2px solid var(--ring)'}
            onBlur={e => e.target.style.outline = 'none'}
          />
        </div>

        {error && (
          <p style={{ color: 'var(--destructive)', fontSize: '13px', margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          style={{
            height: '36px',
            background: loading || !email || !password ? 'var(--muted)' : 'var(--primary)',
            color: loading || !email || !password ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-control)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'background 0.12s',
            marginTop: '4px',
          }}
          onMouseEnter={e => {
            if (!loading && email && password) e.currentTarget.style.background = 'var(--primary-hover)'
          }}
          onMouseLeave={e => {
            if (!loading && email && password) e.currentTarget.style.background = 'var(--primary)'
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
          No account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
