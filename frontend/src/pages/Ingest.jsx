import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIngest } from '@/hooks/useIngest'
import { ApiError } from '@/api/client'
import { getWeeklyResetDate } from '@/lib/utils'

const CHATGPT_URL_REGEX = /^https:\/\/chatgpt\.com\/share\//

function validateUrl(url) {
  if (!url) return ''
  if (!CHATGPT_URL_REGEX.test(url)) return 'The link must start with https://chatgpt.com/share/'
  return ''
}

export default function Ingest() {
  const [tab, setTab] = useState('url') // 'url' | 'text'
  const [shareUrl, setShareUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [urlError, setUrlError] = useState('')
  const [rateLimitMsg, setRateLimitMsg] = useState('')
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useIngest()

  const urlValid = tab === 'url' && CHATGPT_URL_REGEX.test(shareUrl)
  const textValid = tab === 'text' && rawText.trim().length > 100
  const canSubmit = (tab === 'url' ? urlValid : textValid) && !isPending

  const handleUrlChange = (e) => {
    const val = e.target.value
    setShareUrl(val)
    setUrlError(val ? validateUrl(val) : '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setRateLimitMsg('')
    try {
      const payload = tab === 'url' ? { shareUrl } : { rawText }
      const result = await mutateAsync(payload)
      navigate(`/app/processing/${result.source_id}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setRateLimitMsg(`You've used both runs for this week. Your limit resets on ${getWeeklyResetDate()}.`)
      } else {
        setRateLimitMsg(err.message || 'Something went wrong. Try again.')
      }
    }
  }

  const tabStyle = (active) => ({
    padding: '0 16px',
    height: '36px',
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
    <div style={{ padding: '40px 40px', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '4px' }}>
        New notes
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '32px' }}>
        Paste a ChatGPT conversation. We'll turn it into organised study notes.
      </p>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', marginBottom: '24px' }}>
        <button onClick={() => setTab('url')} style={tabStyle(tab === 'url')}>
          Share link
        </button>
        <button onClick={() => setTab('text')} style={tabStyle(tab === 'text')}>
          Paste text
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {tab === 'url' ? (
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="share-url" style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>
              Share link
            </label>
            <input
              id="share-url"
              type="url"
              value={shareUrl}
              onChange={handleUrlChange}
              placeholder="https://chatgpt.com/share/…"
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                border: `1px solid ${urlError ? 'var(--destructive)' : 'var(--input)'}`,
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)',
              }}
              onFocus={e => e.target.style.outline = '2px solid var(--ring)'}
              onBlur={e => e.target.style.outline = 'none'}
            />
            {urlError ? (
              <p style={{ fontSize: '13px', color: 'var(--destructive)', marginTop: '6px', marginBottom: 0 }}>
                {urlError}
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '6px', marginBottom: 0 }}>
                The link must be public. Open it in a private window to check.
              </p>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="raw-text" style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>
              Paste the whole conversation
            </label>
            <textarea
              id="raw-text"
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste the whole conversation here"
              rows={14}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--input)',
                borderRadius: 'var(--radius-panel)',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.outline = '2px solid var(--ring)'}
              onBlur={e => e.target.style.outline = 'none'}
            />
            {rawText && (
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '6px', marginBottom: 0, fontVariantNumeric: 'tabular-nums' }}>
                {rawText.length.toLocaleString()} characters
              </p>
            )}
          </div>
        )}

        {rateLimitMsg && (
          <p style={{ fontSize: '14px', color: 'var(--destructive)', marginBottom: '16px' }}>
            {rateLimitMsg}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Runs left this week: 2 of 2
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              height: '36px',
              padding: '0 16px',
              background: canSubmit ? 'var(--primary)' : 'var(--muted)',
              color: canSubmit ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              border: 'none',
              borderRadius: 'var(--radius-control)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = 'var(--primary-hover)' }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = 'var(--primary)' }}
          >
            {isPending ? 'Creating…' : 'Create notes'}
          </button>
        </div>
      </form>
    </div>
  )
}
