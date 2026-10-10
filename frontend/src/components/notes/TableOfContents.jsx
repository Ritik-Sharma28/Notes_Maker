import { useEffect, useState } from 'react'
import { AlignLeft } from 'lucide-react'

export default function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState('')

  // Extract headings from markdown text
  useEffect(() => {
    if (!content) return

    const lines = content.split('\n')
    const extracted = []
    let inCodeBlock = false

    for (const line of lines) {
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock
        continue
      }
      if (inCodeBlock) continue

      const match = line.match(/^(#{1,3})\s+(.+)/)
      if (match) {
        const level = match[1].length
        const text = match[2].trim()
        const id = text.toLowerCase().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').replace(/-+$/, '')
        extracted.push({ id, text, level })
      }
    }

    setHeadings(extracted)
  }, [content])

  // Setup intersection observer for highlighting active heading
  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings, content])

  if (headings.length === 0) return null

  return (
    <nav style={{ padding: '20px 16px', fontFamily: 'var(--font-sans)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '14px',
      }}>
        <AlignLeft size={12} strokeWidth={2} color="var(--muted-foreground)" />
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--muted-foreground)',
        }}>
          On this page
        </span>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {headings.map((heading) => {
          const isActive = activeId === heading.id
          return (
            <li
              key={heading.id}
              style={{
                paddingLeft: `${(heading.level - 1) * 10}px`,
              }}
            >
              <a
                href={`#${heading.id}`}
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontWeight: isActive ? 500 : 400,
                  textDecoration: 'none',
                  lineHeight: 1.45,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'color 0.12s, background 0.12s',
                  background: isActive ? 'var(--sunken)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--foreground)'
                    e.currentTarget.style.background = 'var(--hover-bg)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--muted-foreground)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById(heading.id)
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' })
                    window.history.pushState(null, '', `#${heading.id}`)
                  }
                }}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
