import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Landing() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Redirect to app if already logged in
  if (isAuthenticated) {
    return <Navigate to="/app/topics" replace />
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: '18px',
          color: 'var(--foreground)',
          letterSpacing: '-0.01em',
        }}>
          ChatNotes
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link
            to="/login"
            style={{
              fontSize: '14px',
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Log in
          </Link>
          <Link
            to="/signup"
            style={{
              fontSize: '14px',
              color: 'var(--primary-foreground)',
              backgroundColor: 'var(--primary)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-control)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--foreground)',
          lineHeight: 1.1,
          marginBottom: '24px',
        }}>
          Turn ChatGPT conversations into structured study notes.
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: 'var(--muted-foreground)',
          lineHeight: 1.5,
          marginBottom: '40px',
          maxWidth: '600px',
        }}>
          Paste your messy, back-and-forth chat history. We extract the facts, organise them into topics, verify accuracy, and generate clean notes with diagrams.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: 'var(--primary-foreground)',
              backgroundColor: 'var(--primary)',
              padding: '0 24px',
              height: '48px',
              borderRadius: 'var(--radius-control)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            Get started for free
          </Link>
        </div>
      </main>
    </div>
  )
}
