import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIngest } from '@/hooks/useIngest'
import { ApiError } from '@/api/client'
import { getWeeklyResetDate } from '@/lib/utils'
import { Link2, AlignLeft, AlertTriangle, Loader2 } from 'lucide-react'

const CHATGPT_URL_REGEX = /^https:\/\/chatgpt\.com\/share\//

function validateUrl(url) {
  if (!url) return ''
  if (!CHATGPT_URL_REGEX.test(url)) return 'Must start with https://chatgpt.com/share/'
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
        setRateLimitMsg(`You've used both runs for this week. Resets on ${getWeeklyResetDate()}.`)
      } else {
        setRateLimitMsg(err.message || 'Something went wrong. Try again.')
      }
    }
  }

  const inputBase = {
    width: '100%',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--card)',
    color: 'var(--foreground)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const tabItems = [
    { id: 'url', label: 'Share link', icon: Link2 },
    { id: 'text', label: 'Paste text', icon: AlignLeft },
  ]

  return (
    <div style={{ padding: '48px 40px', maxWidth: '600px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em',
          marginBottom: '8px', color: 'var(--foreground)',
        }}>
          New notes
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0 }}>
          Paste a ChatGPT conversation. We'll extract the key facts and turn them into clean, organised notes.
        </p>
      </div>

      {/* Tab selector */}
      <div style={{
        display: 'flex',
        gap: '4px',
        backgroundColor: 'var(--sunken)',
        padding: '4px',
        borderRadius: '9px',
        marginBottom: '24px',
        width: 'fit-content',
      }}>
        {tabItems.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: active ? 500 : 400,
                background: active ? 'var(--background)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.12s',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--foreground)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--muted-foreground)' }}
            >
              <Icon size={13} strokeWidth={1.75} />
              {label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit}>

        {tab === 'url' ? (
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="share-url"
              style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500, color: 'var(--foreground)' }}
            >
              ChatGPT share link
            </label>
            <input
              id="share-url"
              type="url"
              value={shareUrl}
              onChange={handleUrlChange}
              placeholder="https://chatgpt.com/share/…"
              style={{
                ...inputBase,
                height: '40px',
                padding: '0 14px',
                borderColor: urlError ? 'var(--destructive)' : 'var(--border)',
              }}
              onFocus={e => { e.target.style.borderColor = urlError ? 'var(--destructive)' : 'var(--ring)'; e.target.style.boxShadow = `0 0 0 3px color-mix(in srgb, ${urlError ? 'var(--destructive)' : 'var(--ring)'} 12%, transparent)` }}
              onBlur={e => { e.target.style.borderColor = urlError ? 'var(--destructive)' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
            <p style={{
              fontSize: '12.5px',
              color: urlError ? 'var(--destructive)' : 'var(--muted-foreground)',
              marginTop: '7px',
              marginBottom: 0,
              lineHeight: 1.5,
            }}>
              {urlError || 'The link must be set to public. Open it in a private window to verify.'}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="raw-text"
              style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500, color: 'var(--foreground)' }}
            >
              Paste the whole conversation
            </label>
            <textarea
              id="raw-text"
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste the conversation here — include both sides of the dialogue…"
              rows={13}
              style={{
                ...inputBase,
                padding: '14px',
                resize: 'vertical',
                lineHeight: 1.6,
                minHeight: '200px',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--ring)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--ring) 12%, transparent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px' }}>
              <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', margin: 0 }}>
                Minimum 100 characters required.
              </p>
              {rawText && (
                <p style={{
                  fontSize: '12.5px',
                  color: rawText.trim().length > 100 ? 'var(--primary)' : 'var(--muted-foreground)',
                  margin: 0,
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {rawText.length.toLocaleString()} chars
                </p>
              )}
            </div>
          </div>
        )}

        {/* Rate limit warning */}
        {rateLimitMsg && (
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'color-mix(in srgb, var(--destructive) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
            marginBottom: '20px',
          }}>
            <AlertTriangle size={15} strokeWidth={1.75} color="var(--destructive)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: 'var(--destructive)', margin: 0, lineHeight: 1.5 }}>
              {rateLimitMsg}
            </p>
          </div>
        )}

        {/* Footer row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <span style={{
            fontSize: '12.5px',
            color: 'var(--muted-foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px', height: '6px', borderRadius: '50%',
              backgroundColor: 'var(--primary)',
            }} />
            2 of 2 runs left this week
          </span>

          <button
            type="submit"
            disabled={!canSubmit}
            id="ingest-submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              height: '38px',
              padding: '0 20px',
              background: canSubmit ? 'var(--primary)' : 'var(--sunken)',
              color: canSubmit ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (canSubmit) { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.transform = 'scale(1.02)' } }}
            onMouseLeave={e => { if (canSubmit) { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1)' } }}
          >
            {isPending && <Loader2 size={14} strokeWidth={1.75} style={{ animation: 'spin 1s linear infinite' }} />}
            {isPending ? 'Creating…' : 'Create notes'}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
