import { useLocation, Link } from 'react-router-dom'
import { Sun, Moon, Monitor, ChevronRight } from 'lucide-react'
import { useTheme } from '@/app/ThemeProvider'

const PAGE_TITLES = {
  '/app/ingest': 'New notes',
  '/app/topics': 'Notes',
  '/app/sources': 'Sources',
  '/app/settings': 'Settings',
}

function getPageInfo(pathname) {
  if (pathname.startsWith('/app/processing/')) return { title: 'Processing', breadcrumb: null }
  if (pathname.startsWith('/app/topics/')) return { title: 'Notes', breadcrumb: null }
  return { title: PAGE_TITLES[pathname] || 'ChatNotes', breadcrumb: null }
}

export default function PageHeader({ onMenuClick, sidebarOpen }) {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { title } = getPageInfo(location.pathname)

  const cycleTheme = () => {
    const next = { system: 'light', light: 'dark', dark: 'system' }
    setTheme(next[theme] || 'system')
  }

  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon
  const themeLabel = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' }[theme]

  return (
    <header style={{
      height: '48px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      justifyContent: 'space-between',
      backgroundColor: 'var(--background)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Breadcrumb / page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          fontSize: '13.5px',
          fontWeight: 500,
          color: 'var(--muted-foreground)',
          letterSpacing: '-0.01em',
        }}>
          ChatNotes
        </span>
        {title && title !== 'ChatNotes' && (
          <>
            <ChevronRight size={13} strokeWidth={1.5} color="var(--border)" />
            <span style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: 'var(--foreground)',
              letterSpacing: '-0.01em',
            }}>
              {title}
            </span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={cycleTheme}
          aria-label={themeLabel}
          title={themeLabel}
          style={{
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            borderRadius: '6px',
            transition: 'color 0.12s, background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.background = 'var(--sunken)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.background = 'none' }}
        >
          <ThemeIcon size={15} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  )
}
