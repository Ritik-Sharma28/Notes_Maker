import { useEffect, useState } from 'react'

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
        // Simple slugify matching rehype-slug
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
  }, [headings, content]) // Re-run if content changes

  if (headings.length === 0) return null

  return (
    <nav style={{ padding: '24px', fontFamily: 'var(--font-sans)' }}>
      <p style={{
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--muted-foreground)',
        marginBottom: '16px',
      }}>
        On this page
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{
              paddingLeft: `${(heading.level - 1) * 12}px`,
            }}
          >
            <a
              href={`#${heading.id}`}
              style={{
                display: 'block',
                fontSize: '13px',
                color: activeId === heading.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: activeId === heading.id ? 500 : 400,
                textDecoration: 'none',
                lineHeight: 1.4,
                transition: 'color 0.12s',
              }}
              onMouseEnter={(e) => {
                if (activeId !== heading.id) e.currentTarget.style.color = 'var(--foreground)'
              }}
              onMouseLeave={(e) => {
                if (activeId !== heading.id) e.currentTarget.style.color = 'var(--muted-foreground)'
              }}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(heading.id)
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' })
                  // Update URL hash without jumping
                  window.history.pushState(null, '', `#${heading.id}`)
                }
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
