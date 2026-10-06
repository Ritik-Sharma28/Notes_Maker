import { Link } from 'react-router-dom'

export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '18px',
            color: 'var(--foreground)',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          ChatNotes
        </Link>
      </div>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {children}
      </div>
    </div>
  )
}
