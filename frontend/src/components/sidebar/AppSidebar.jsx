import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FilePlus2, BookOpen, Inbox, Settings, ChevronRight, LogOut, PenLine } from 'lucide-react'
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

  const sidebarWidth = isOpen ? '220px' : '54px'

  // User initials avatar
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

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
      transition: 'width 0.18s cubic-bezier(0.4,0,0.2,1), min-width 0.18s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0,
    }}>

      {/* Logo + collapse */}
      <div style={{
        height: '54px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: isOpen ? '0 12px 0 14px' : '0',
        justifyContent: isOpen ? 'space-between' : 'center',
        flexShrink: 0,
      }}>
        {isOpen && (
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: '26px', height: '26px', borderRadius: '7px',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <PenLine size={13} strokeWidth={2} color="var(--primary-foreground)" />
            </div>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}>
              ChatNotes
            </span>
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
            borderRadius: '6px',
            flexShrink: 0,
            transition: 'color 0.12s, background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.background = 'var(--background)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.background = 'none' }}
        >
          <ChevronRight
            size={15}
            strokeWidth={2}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s ease-out',
            }}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>

        {/* New notes button */}
        <Link
          to="/app/ingest"
          title={!isOpen ? 'New notes' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isOpen ? '0 10px' : '0',
            height: '34px',
            borderRadius: '7px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            marginBottom: '6px',
            justifyContent: isOpen ? 'flex-start' : 'center',
            transition: 'background 0.12s, transform 0.1s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.transform = 'scale(1.01)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          <FilePlus2 size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
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
                padding: isOpen ? '0 10px' : '0',
                height: '32px',
                borderRadius: '7px',
                background: active ? 'var(--background)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                textDecoration: 'none',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                justifyContent: isOpen ? 'flex-start' : 'center',
                transition: 'background 0.12s, color 0.12s',
                fontWeight: active ? 500 : 400,
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
              <Icon size={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              {isOpen && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px', flexShrink: 0 }}>
        <Link
          to="/app/settings"
          title={!isOpen ? 'Settings' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isOpen ? '0 10px' : '0',
            height: '32px',
            borderRadius: '7px',
            background: isActive('/app/settings') ? 'var(--background)' : 'transparent',
            color: isActive('/app/settings') ? 'var(--foreground)' : 'var(--muted-foreground)',
            textDecoration: 'none',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            justifyContent: isOpen ? 'flex-start' : 'center',
            transition: 'background 0.12s, color 0.12s',
            marginBottom: '4px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--background)'; e.currentTarget.style.color = 'var(--foreground)' }}
          onMouseLeave={e => { e.currentTarget.style.background = isActive('/app/settings') ? 'var(--background)' : 'transparent'; e.currentTarget.style.color = isActive('/app/settings') ? 'var(--foreground)' : 'var(--muted-foreground)' }}
        >
          <Settings size={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          {isOpen && <span>Settings</span>}
        </Link>

        {/* User row */}
        {isOpen && user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '7px',
            marginTop: '2px',
          }}>
            {/* Avatar */}
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary-foreground)', letterSpacing: '0.01em' }}>
                {initials}
              </span>
            </div>
            <span style={{
              fontSize: '12px',
              color: 'var(--muted-foreground)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
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
                borderRadius: '5px',
                flexShrink: 0,
                transition: 'color 0.12s, background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--destructive)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--destructive) 10%, transparent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.background = 'none' }}
            >
              <LogOut size={13} strokeWidth={1.5} />
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
              borderRadius: '7px',
              transition: 'color 0.12s, background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--destructive)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--destructive) 8%, transparent)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.background = 'none' }}
          >
            <LogOut size={15} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </aside>
  )
}
