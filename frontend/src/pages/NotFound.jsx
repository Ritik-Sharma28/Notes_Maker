import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: '48px',
        fontWeight: 600,
        color: 'var(--foreground)',
        marginBottom: '16px',
        letterSpacing: '-0.02em',
      }}>
        404
      </h1>
      <p style={{
        fontSize: '16px',
        color: 'var(--muted-foreground)',
        marginBottom: '32px',
      }}>
        We couldn't find the page you were looking for.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '36px',
          padding: '0 16px',
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: 'var(--radius-control)',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
      >
        Go home
      </Link>
    </div>
  )
}
