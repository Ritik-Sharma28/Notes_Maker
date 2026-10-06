import { useLocation } from 'react-router-dom'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/app/ThemeProvider'

const PAGE_TITLES = {
  '/app/ingest': 'New notes',
  '/app/topics': 'Notes',
  '/app/sources': 'Sources',
  '/app/settings': 'Settings',
}

function getPageTitle(pathname) {
  if (pathname.startsWith('/app/processing/')) return 'Creating your notes'
  if (pathname.startsWith('/app/topics/')) return 'Notes'
  return PAGE_TITLES[pathname] || 'ChatNotes'
}

export default function PageHeader({ onMenuClick, sidebarOpen }) {
  const location = useLocation()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const title = getPageTitle(location.pathname)

  const cycleTheme = () => {
    const next = { system: 'light', light: 'dark', dark: 'system' }
    setTheme(next[theme] || 'system')
  }

  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon
  const themeLabel = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' }[theme]

  return (
    <header style={{
      height: '56px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      justifyContent: 'space-between',
      backgroundColor: 'var(--background)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--foreground)',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={cycleTheme}
          aria-label={themeLabel}
          title={themeLabel}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            borderRadius: 'var(--radius-control)',
            transition: 'color 0.12s, background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.background = 'var(--sunken)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.background = 'none' }}
        >
          <ThemeIcon size={16} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  )
}
