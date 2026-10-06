import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTopicNote } from '@/hooks/useTopics'
import MarkdownRenderer from '@/components/notes/MarkdownRenderer'
import HtmlPreview from '@/components/notes/HtmlPreview'
import TableOfContents from '@/components/notes/TableOfContents'
import { Download, Copy, Check } from 'lucide-react'
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
      // Download Markdown
      if (!note?.content_markdown) return
      const blob = new Blob([note.content_markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `note-${topicId}.md`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // Download HTML
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
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '48px', width: '60%', borderRadius: '8px', marginBottom: '32px' }} />
        <div className="skeleton" style={{ height: '24px', width: '100%', borderRadius: '4px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '24px', width: '95%', borderRadius: '4px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '24px', width: '90%', borderRadius: '4px', marginBottom: '32px' }} />
        <div className="skeleton" style={{ height: '200px', width: '100%', borderRadius: '8px' }} />
      </div>
    )
  }

  if (error || !note) {
    return (
      <div style={{ padding: '40px', color: 'var(--destructive)', fontSize: '14px' }}>
        Couldn't load this note.
      </div>
    )
  }

  const tabStyle = (active) => ({
    padding: '0 16px',
    height: '40px',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--foreground)' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
    fontWeight: active ? 500 : 400,
    fontFamily: 'var(--font-sans)',
    transition: 'color 0.12s',
    marginBottom: '-1px',
  })

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar: Tabs + Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          backgroundColor: 'var(--background)',
          flexShrink: 0,
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex' }}>
            <button onClick={() => setTab('notes')} style={tabStyle(tab === 'notes')}>
              Notes
            </button>
            <button onClick={() => setTab('html')} style={tabStyle(tab === 'html')}>
              HTML Preview
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopy}
              aria-label="Copy to clipboard"
              title="Copy Markdown"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 12px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
                color: 'var(--foreground)',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              aria-label="Download"
              title={`Download ${tab === 'notes' ? 'Markdown' : 'HTML'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 12px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
                color: 'var(--foreground)',
                fontSize: '13px',
                cursor: downloading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = 'var(--sunken)' }}
              onMouseLeave={e => { if (!downloading) e.currentTarget.style.background = 'transparent' }}
            >
              <Download size={14} />
              {downloading ? 'Downloading...' : 'Download'}
            </button>
          </div>
        </div>

        {/* Content scroll area */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'notes' ? (
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              padding: '40px 24px 80px',
            }}>
              <MarkdownRenderer content={note.content_markdown} />
            </div>
          ) : (
            <HtmlPreview topicId={topicId} />
          )}
        </div>
      </div>

      {/* Right rail: Table of contents (only for notes tab) */}
      {tab === 'notes' && (
        <div style={{
          width: '240px',
          minWidth: '240px',
          borderLeft: '1px solid var(--border)',
          backgroundColor: 'var(--background)',
          overflowY: 'auto',
          display: 'none', // Hidden on small screens, shown via media query normally, but we'll enforce it here
        }} className="toc-sidebar">
          <TableOfContents content={note.content_markdown} />
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .toc-sidebar {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
