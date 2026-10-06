import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Sign up failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', letterSpacing: '-0.01em' }}>
          Check your email
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
          We sent a confirmation link to <strong style={{ color: 'var(--foreground)' }}>{email}</strong>.
          Open it to activate your account, then sign in.
        </p>
        <div style={{ marginTop: '20px' }}>
          <Link
            to="/login"
            style={{
              fontSize: '14px',
              color: 'var(--primary)',
              textDecoration: 'none',
            }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', letterSpacing: '-0.01em' }}>
        Create an account
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>
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

        <div>
          <label htmlFor="password" style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 12px',
              border: `1px solid ${error?.includes('Password') ? 'var(--destructive)' : 'var(--input)'}`,
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
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px', marginBottom: 0 }}>
            At least 6 characters.
          </p>
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
            marginTop: '4px',
          }}
          onMouseEnter={e => {
            if (!loading && email && password) e.currentTarget.style.background = 'var(--primary-hover)'
          }}
          onMouseLeave={e => {
            if (!loading && email && password) e.currentTarget.style.background = 'var(--primary)'
          }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '24px' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
