import { useSources } from '@/hooks/useSources'
import { Link } from 'react-router-dom'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function Sources() {
  const { data: sources, isLoading, error } = useSources()

  if (isLoading) {
    return (
      <div style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '24px' }}>
          Sources
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '48px', width: '100%', borderRadius: 'var(--radius-control)' }} />
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
    <div style={{ padding: '40px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '8px' }}>
        Sources
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '32px' }}>
        A history of the ChatGPT conversations you've processed.
      </p>

      {sortedSources.length === 0 ? (
        <div style={{ padding: '40px 0', color: 'var(--muted-foreground)', fontSize: '14px' }}>
          You haven't added any sources yet.
        </div>
      ) : (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-panel)',
          overflow: 'hidden',
          backgroundColor: 'var(--card)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--sunken)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--muted-foreground)' }}>Source</th>
                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--muted-foreground)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--muted-foreground)' }}>Added</th>
              </tr>
            </thead>
            <tbody>
              {sortedSources.map(source => (
                <tr key={source.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    {source.share_url ? (
                      <a
                        href={source.share_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--foreground)',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {source.share_url}
                        <ExternalLink size={14} color="var(--muted-foreground)" />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--foreground)' }}>Text Paste</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {source.status === 'completed' && <CheckCircle2 size={16} color="var(--primary)" />}
                      {source.status === 'failed' && <XCircle size={16} color="var(--destructive)" />}
                      {source.status === 'processing' && <Loader2 size={16} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />}
                      {source.status === 'pending' && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--muted-foreground)', display: 'inline-block', margin: '0 4px' }} />}
                      
                      <span style={{ 
                        color: source.status === 'failed' ? 'var(--destructive)' : 'var(--foreground)',
                        textTransform: 'capitalize' 
                      }}>
                        {source.status === 'processing' ? (
                          <Link to={`/app/processing/${source.id}`} style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            Processing
                          </Link>
                        ) : source.status === 'failed' ? (
                          <Link to={`/app/processing/${source.id}`} style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            Failed
                          </Link>
                        ) : (
                          source.status
                        )}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted-foreground)' }}>
                    <span title={formatDate(source.created_at)}>
                      {formatRelativeTime(source.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
