import React, { useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import mermaid from 'mermaid'

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
})

function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    if (!chart) return
    const renderChart = async () => {
      try {
        setError(false)
        const { svg: renderedSvg } = await mermaid.render(id.current, chart)
        setSvg(renderedSvg)
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError(true)
      }
    }
    renderChart()
  }, [chart])

  if (error) {
    return (
      <figure style={{ margin: '1.5em 0' }}>
        <div style={{
          padding: '16px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-panel)',
          backgroundColor: 'var(--sunken)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--muted-foreground)',
          overflowX: 'auto',
          whiteSpace: 'pre',
        }}>
          {chart}
        </div>
        <figcaption style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '8px', textAlign: 'center' }}>
          Diagram couldn't be drawn.
        </figcaption>
      </figure>
    )
  }

  return (
    <figure style={{
      margin: '1.5em 0',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-panel)',
      backgroundColor: 'var(--card)',
      padding: '24px',
      overflowX: 'auto',
    }}>
      <div dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'flex', justifyContent: 'center' }} />
    </figure>
  )
}

function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const lang = match ? match[1] : ''
  const code = String(children).replace(/\n$/, '')

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (inline) {
    return <code className={className} {...props}>{children}</code>
  }

  if (lang === 'mermaid') {
    return <MermaidDiagram chart={code} />
  }

  return (
    <div style={{
      position: 'relative',
      margin: '1.5em 0',
      borderRadius: 'var(--radius-panel)',
      border: '1px solid var(--border)',
      backgroundColor: 'var(--sunken)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
          {lang || 'text'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted-foreground)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '12px', overflowX: 'auto' }}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

export default function MarkdownRenderer({ content }) {
  // Strip HTML comments entirely so reviewer feedback doesn't render
  const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '')

  return (
    <div className="note-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          code: CodeBlock,
          table: ({ node, ...props }) => (
            <div style={{ overflowX: 'auto' }}>
              <table {...props} />
            </div>
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  )
}
