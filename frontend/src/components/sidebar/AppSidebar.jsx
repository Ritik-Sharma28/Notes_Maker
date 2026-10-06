import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FilePlus2, BookOpen, Inbox, Settings, ChevronRight, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { to: '/app/topics', icon: BookOpen, label: 'Notes' },
  { to: '/app/sources', icon: Inbox, label: 'Sources' },
]

export default function AppSidebar({ isOpen, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/')

  const sidebarWidth = isOpen ? '248px' : '56px'

  return (
    <aside style={{
      width: sidebarWidth,
      minWidth: sidebarWidth,
      backgroundColor: 'var(--sunken)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      transition: 'width 0.15s ease-out, min-width 0.15s ease-out',
      flexShrink: 0,
    }}>
      {/* Wordmark / collapse button */}
      <div style={{
        height: '56px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: isOpen ? '0 16px' : '0',
        justifyContent: isOpen ? 'space-between' : 'center',
        flexShrink: 0,
      }}>
        {isOpen && (
          <Link
            to="/"
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--foreground)',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            ChatNotes
          </Link>
        )}
        <button
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            borderRadius: 'var(--radius-control)',
            flexShrink: 0,
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
        >
          <ChevronRight
            size={16}
            strokeWidth={1.5}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease-out',
            }}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
        {/* New notes button */}
        <Link
          to="/app/ingest"
          title={!isOpen ? 'New notes' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isOpen ? '0 12px' : '0',
            height: '36px',
            borderRadius: 'var(--radius-control)',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            marginBottom: '8px',
            justifyContent: isOpen ? 'flex-start' : 'center',
            transition: 'background 0.12s',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
        >
          <FilePlus2 size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          {isOpen && <span>New notes</span>}
        </Link>

        {/* Nav items */}
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = isActive(to)
          return (
            <Link
              key={to}
              to={to}
              title={!isOpen ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isOpen ? '0 12px' : '0',
                height: '32px',
                borderRadius: 'var(--radius-control)',
                background: active ? 'var(--background)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                textDecoration: 'none',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                justifyContent: isOpen ? 'flex-start' : 'center',
                transition: 'background 0.12s, color 0.12s',
                borderLeft: active && isOpen ? '2px solid var(--primary)' : '2px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--background)'
                  e.currentTarget.style.color = 'var(--foreground)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--muted-foreground)'
                }
              }}
            >
              <Icon size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              {isOpen && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Settings + user */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px', flexShrink: 0 }}>
        <Link
          to="/app/settings"
          title={!isOpen ? 'Settings' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isOpen ? '0 12px' : '0',
            height: '32px',
            borderRadius: 'var(--radius-control)',
            background: isActive('/app/settings') ? 'var(--background)' : 'transparent',
            color: 'var(--muted-foreground)',
            textDecoration: 'none',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            justifyContent: isOpen ? 'flex-start' : 'center',
            transition: 'background 0.12s, color 0.12s',
            marginBottom: '4px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--background)'; e.currentTarget.style.color = 'var(--foreground)' }}
          onMouseLeave={e => { e.currentTarget.style.background = isActive('/app/settings') ? 'var(--background)' : 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
        >
          <Settings size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          {isOpen && <span>Settings</span>}
        </Link>

        {/* User row */}
        {isOpen && user && (
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted-foreground)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: 'var(--radius-control)',
                flexShrink: 0,
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
            >
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {!isOpen && user && (
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            style={{
              width: '100%',
              height: '32px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-control)',
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
          >
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </aside>
  )
}
