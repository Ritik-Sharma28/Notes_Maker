import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/app/ThemeProvider'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div style={{ padding: '40px', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '32px' }}>
        Settings
      </h1>

      {/* Account Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>
          Account
        </h2>
        <div style={{
          padding: '16px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-panel)',
          backgroundColor: 'var(--card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Email Address</div>
            <div style={{ fontSize: '14px', color: 'var(--foreground)' }}>{user?.email}</div>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>
          Appearance
        </h2>
        <div style={{
          padding: '16px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-panel)',
          backgroundColor: 'var(--card)',
        }}>
          <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Theme</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['system', 'light', 'dark'].map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={theme === t}
                  onChange={() => setTheme(t)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--foreground)', textTransform: 'capitalize' }}>
                  {t}
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '36px',
            padding: '0 16px',
            background: 'var(--card)',
            color: 'var(--destructive)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-control)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--sunken)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign out
        </button>
      </section>
    </div>
  )
}
