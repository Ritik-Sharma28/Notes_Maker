import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTopicNote } from '@/hooks/useTopics'
import MarkdownRenderer from '@/components/notes/MarkdownRenderer'
import HtmlPreview from '@/components/notes/HtmlPreview'
import TableOfContents from '@/components/notes/TableOfContents'
import { Download, Copy, Check, FileText, Code2, Loader2 } from 'lucide-react'
import { getHtmlExport } from '@/api/export'

export default function Note() {
  const { topicId } = useParams()
  const { data: note, isLoading, error } = useTopicNote(topicId)
  const [tab, setTab] = useState('notes') // 'notes' | 'html'
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const scrollRef = useRef(null)

  const handleCopy = () => {
    if (!note?.content_markdown) return
    navigator.clipboard.writeText(note.content_markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    if (tab === 'notes') {
      if (!note?.content_markdown) return
      const blob = new Blob([note.content_markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `note-${topicId}.md`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      try {
        setDownloading(true)
        const html = await getHtmlExport(topicId)
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `note-${topicId}.html`
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('Download failed', err)
      } finally {
        setDownloading(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '48px 40px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '40px', width: '55%', borderRadius: '8px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '16px', width: '30%', borderRadius: '4px', marginBottom: '40px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[100, 95, 88, 100, 72, 90, 65].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: '18px', width: `${w}%`, borderRadius: '4px' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div style={{
        padding: '48px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: '12px',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          backgroundColor: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={22} strokeWidth={1.5} color="var(--destructive)" />
        </div>
        <p style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 500, margin: 0 }}>
          Couldn't load this note
        </p>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>
          Try refreshing the page.
        </p>
      </div>
    )
  }

  const tabs = [
    { id: 'notes', label: 'Note', icon: FileText },
    { id: 'html', label: 'HTML Preview', icon: Code2 },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          padding: '0 20px',
          backgroundColor: 'var(--background)',
          flexShrink: 0,
          height: '48px',
          gap: '12px',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '2px', height: '100%', alignItems: 'center' }}>
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '30px',
                    padding: '0 12px',
                    background: active ? 'var(--sunken)' : 'none',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                    fontWeight: active ? 500 : 400,
                    fontFamily: 'var(--font-sans)',
                    transition: 'color 0.12s, background 0.12s',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--sunken)'; e.currentTarget.style.color = 'var(--foreground)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted-foreground)' } }}
                >
                  <Icon size={13} strokeWidth={1.5} />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleCopy}
              aria-label="Copy to clipboard"
              title="Copy Markdown"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                height: '30px',
                padding: '0 10px',
                background: copied ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
                border: '1px solid',
                borderColor: copied ? 'var(--primary)' : 'var(--border)',
                borderRadius: '6px',
                color: copied ? 'var(--primary)' : 'var(--foreground)',
                fontSize: '12.5px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
                fontWeight: 500,
              }}
              onMouseEnter={e => { if (!copied) { e.currentTarget.style.background = 'var(--sunken)'; e.currentTarget.style.borderColor = 'var(--foreground)' } }}
              onMouseLeave={e => { if (!copied) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' } }}
            >
              {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.5} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              aria-label="Download"
              title={`Download ${tab === 'notes' ? 'Markdown' : 'HTML'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                height: '30px',
                padding: '0 10px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: downloading ? 'var(--muted-foreground)' : 'var(--foreground)',
                fontSize: '12.5px',
                cursor: downloading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.12s',
                fontWeight: 500,
              }}
              onMouseEnter={e => { if (!downloading) { e.currentTarget.style.background = 'var(--sunken)'; e.currentTarget.style.borderColor = 'var(--foreground)' } }}
              onMouseLeave={e => { if (!downloading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' } }}
            >
              {downloading
                ? <Loader2 size={13} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
                : <Download size={13} strokeWidth={1.5} />
              }
              {downloading ? 'Saving…' : 'Download'}
            </button>
          </div>
        </div>

        {/* Content scroll area */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'notes' ? (
            <div style={{
              maxWidth: '780px',
              margin: '0 auto',
              padding: '48px 32px 96px',
            }}>
              <MarkdownRenderer content={note.content_markdown} />
            </div>
          ) : (
            <HtmlPreview topicId={topicId} />
          )}
        </div>
      </div>

      {/* Right rail: Table of contents */}
      {tab === 'notes' && (
        <div style={{
          width: '228px',
          minWidth: '228px',
          borderLeft: '1px solid var(--border)',
          backgroundColor: 'var(--background)',
          overflowY: 'auto',
          display: 'none',
        }} className="toc-sidebar">
          <TableOfContents content={note.content_markdown} />
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 1024px) {
          .toc-sidebar {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
