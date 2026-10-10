import { useSources } from '@/hooks/useSources'
import { Link } from 'react-router-dom'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { ExternalLink, CheckCircle2, XCircle, Loader2, Inbox, ArrowRight } from 'lucide-react'

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'var(--destructive)', bg: 'color-mix(in srgb, var(--destructive) 10%, transparent)', icon: XCircle },
  processing: { label: 'Processing', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)', icon: Loader2 },
  pending: { label: 'Pending', color: 'var(--muted-foreground)', bg: 'var(--sunken)', icon: null },
}

function SourceRow({ source, index }) {
  const cfg = STATUS_CONFIG[source.status] || STATUS_CONFIG.pending
  const StatusIcon = cfg.icon
  const isClickable = source.status === 'processing' || source.status === 'failed'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 1fr auto auto',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 20px',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--sunken)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Index */}
      <span style={{
        fontSize: '12px',
        color: 'var(--muted-foreground)',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'var(--font-mono)',
        textAlign: 'right',
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Source URL / label */}
      <div style={{ minWidth: 0 }}>
        {source.share_url ? (
          <a
            href={source.share_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontSize: '13.5px',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--foreground)'}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {source.share_url.replace('https://chatgpt.com/share/', 'chatgpt.com/share/')}
            </span>
            <ExternalLink size={12} strokeWidth={1.5} style={{ flexShrink: 0, opacity: 0.6 }} />
          </a>
        ) : (
          <span style={{ fontSize: '13.5px', color: 'var(--foreground)', fontStyle: 'italic' }}>
            Text paste
          </span>
        )}
      </div>

      {/* Status badge */}
      <div>
        {isClickable ? (
          <Link
            to={`/app/processing/${source.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              color: cfg.color,
              backgroundColor: cfg.bg,
              textDecoration: 'none',
              transition: 'opacity 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {StatusIcon && (
              <StatusIcon
                size={12}
                strokeWidth={1.75}
                style={source.status === 'processing' ? { animation: 'spin 1s linear infinite' } : {}}
              />
            )}
            {cfg.label}
            <ArrowRight size={10} strokeWidth={2} />
          </Link>
        ) : (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500,
            color: cfg.color,
            backgroundColor: cfg.bg,
          }}>
            {StatusIcon && <StatusIcon size={12} strokeWidth={1.75} />}
            {cfg.label}
          </span>
        )}
      </div>

      {/* Date */}
      <span
        title={formatDate(source.created_at)}
        style={{
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {formatRelativeTime(source.created_at)}
      </span>
    </div>
  )
}

export default function Sources() {
  const { data: sources, isLoading, error } = useSources()

  if (isLoading) {
    return (
      <div style={{ padding: '40px 40px', maxWidth: '900px' }}>
        <div className="skeleton" style={{ height: '28px', width: '120px', borderRadius: '6px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '16px', width: '260px', borderRadius: '4px', marginBottom: '32px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '52px', borderRadius: 0, margin: 0 }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', color: 'var(--destructive)', fontSize: '14px' }}>
        Couldn't load sources.
      </div>
    )
  }

  const sortedSources = [...(sources || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div style={{ padding: '40px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '6px', color: 'var(--foreground)' }}>
          Sources
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)', margin: 0 }}>
          A history of the ChatGPT conversations you've processed.
        </p>
      </div>

      {sortedSources.length === 0 ? (
        <div style={{
          padding: '60px 40px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          border: '1px solid var(--border)', borderRadius: '12px',
          backgroundColor: 'var(--card)',
          gap: '12px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            backgroundColor: 'var(--sunken)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Inbox size={22} strokeWidth={1.5} color="var(--muted-foreground)" />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 500, margin: 0 }}>
            No sources yet
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
            Paste your first ChatGPT conversation to get started.
          </p>
          <Link
            to="/app/ingest"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '4px', height: '34px', padding: '0 16px',
              background: 'var(--primary)', color: 'var(--primary-foreground)',
              borderRadius: '7px', textDecoration: 'none',
              fontSize: '13px', fontWeight: 500,
            }}
          >
            New notes
          </Link>
        </div>
      ) : (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: 'var(--card)',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr auto auto',
            gap: '12px',
            padding: '10px 20px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--sunken)',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>#</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Added</span>
          </div>

          {sortedSources.map((source, i) => (
            <SourceRow key={source.id} source={source} index={i} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
