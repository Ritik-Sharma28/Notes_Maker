import { useState, useEffect } from 'react'
import { getHtmlExport } from '@/api/export'

export default function HtmlPreview({ topicId }) {
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchHtml = async () => {
      setLoading(true)
      try {
        const res = await getHtmlExport(topicId)
        if (mounted) {
          setHtml(res)
          setError('')
        }
      } catch (err) {
        if (mounted) setError("Couldn't load HTML preview.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchHtml()
    return () => { mounted = false }
  }, [topicId])

  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton" style={{ height: '40px', width: '70%', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '24px', width: '40%', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '100px', width: '100%', borderRadius: '6px', marginTop: '20px' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', color: 'var(--destructive)', fontSize: '14px' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe
        srcDoc={html}
        title="HTML Preview"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#fff', // HTML exports usually assume white background
        }}
      />
    </div>
  )
}
