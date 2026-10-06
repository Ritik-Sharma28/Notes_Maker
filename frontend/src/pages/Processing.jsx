import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProgress } from '@/hooks/useProgress'
import { useRetrySource } from '@/hooks/useSources'
import { PIPELINE_STAGES, agentToStage, getStageStatus, humanizeAgent } from '@/lib/pipelineStages'
import { formatElapsed } from '@/lib/utils'
import { Check, AlertCircle, RotateCw, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { ApiError } from '@/api/client'

// ─── Stage node ──────────────────────────────────────────────────────────────
function StageNode({ stage, status, isLast }) {
  const [wasActive, setWasActive] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (status === 'active' && !wasActive) {
      setWasActive(true)
      setAnimating(true)
      const t = setTimeout(() => setAnimating(false), 450)
      return () => clearTimeout(t)
    }
  }, [status, wasActive])

  const nodeColor =
    status === 'done' ? 'var(--primary)'
    : status === 'active' ? 'var(--primary)'
    : status === 'failed' ? 'var(--destructive)'
    : 'var(--border)'

  const labelStyle = {
    fontSize: '12px',
    color: status === 'waiting' ? 'var(--muted-foreground)' : 'var(--foreground)',
    fontWeight: status === 'active' ? 500 : 400,
    whiteSpace: 'nowrap',
    position: 'relative',
    padding: '1px 4px',
    borderRadius: '2px',
  }

  const markerStyle = animating ? {
    background: 'linear-gradient(var(--marker) 0 0) no-repeat left center',
    backgroundSize: '100% 100%',
    animation: 'marker-swipe 400ms ease-out forwards',
  } : status === 'active' ? {
    backgroundColor: 'var(--marker)',
  } : {}

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {/* Node */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        {/* Circle */}
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: `1.5px solid ${nodeColor}`,
          backgroundColor: status === 'done' ? 'var(--primary)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'border-color 0.2s, background-color 0.2s',
        }}>
          {status === 'done' && <Check size={11} strokeWidth={2.5} color="var(--primary-foreground)" />}
          {status === 'active' && (
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              border: '1.5px solid var(--primary)', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
          )}
          {status === 'failed' && <AlertCircle size={12} color="var(--destructive)" />}
        </div>
        {/* Label */}
        <span style={{ ...labelStyle, ...markerStyle }}>{stage.label}</span>
      </div>

      {/* Connector line */}
      {!isLast && (
        <div style={{
          width: '80px',
          height: '1.5px',
          backgroundColor: 'var(--border)',
          position: 'relative',
          marginBottom: '22px',
          flexShrink: 0,
        }}>
          {(status === 'done') && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              backgroundColor: 'var(--primary)',
              animation: 'connector-fill 300ms ease-out forwards',
            }} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Activity log item ────────────────────────────────────────────────────────
function ActivityItem({ agent, step, percentage, retryCount, updatedAt, startedAt }) {
  const elapsed = startedAt ? (() => {
    const diffMs = new Date(updatedAt) - new Date(startedAt)
    const diffSecs = Math.floor(Math.max(0, diffMs) / 1000)
    const mins = Math.floor(diffSecs / 60)
    const secs = diffSecs % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  })() : null

  const message = step || humanizeAgent(agent) || 'Processing…'

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '8px 0',
      borderBottom: '1px solid var(--border)',
      alignItems: 'baseline',
    }}>
      {elapsed && (
        <span style={{
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
        }}>
          {elapsed}
        </span>
      )}
      <span style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: 1.5 }}>
        {message}
        {retryCount > 0 && (
          <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginLeft: '8px' }}>
            (attempt {retryCount + 1})
          </span>
        )}
      </span>
    </div>
  )
}

// ─── Technical details ────────────────────────────────────────────────────────
function TechnicalDetails({ progress }) {
  const [open, setOpen] = useState(false)
  if (!progress) return null
  return (
    <div style={{ marginTop: '16px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          color: 'var(--muted-foreground)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: 0,
          fontFamily: 'var(--font-sans)',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
      >
        Technical details
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div style={{
          marginTop: '8px',
          backgroundColor: 'var(--sunken)',
          borderRadius: 'var(--radius-panel)',
          padding: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          lineHeight: 1.7,
        }}>
          <div><span style={{ color: 'var(--foreground)' }}>current_agent:</span> {progress.current_agent ?? '—'}</div>
          <div><span style={{ color: 'var(--foreground)' }}>current_step:</span> {progress.current_step ?? '—'}</div>
          <div><span style={{ color: 'var(--foreground)' }}>percentage:</span> {progress.percentage ?? 0}%</div>
          <div><span style={{ color: 'var(--foreground)' }}>retry_count:</span> {progress.retry_count ?? 0}</div>
          <div><span style={{ color: 'var(--foreground)' }}>message:</span> {progress.message ?? '—'}</div>
          <div><span style={{ color: 'var(--foreground)' }}>updated_at:</span> {progress.updated_at ?? '—'}</div>
        </div>
      )}
    </div>
  )
}

// ─── Main processing page ─────────────────────────────────────────────────────
export default function Processing() {
  const { sourceId } = useParams()
  const { data: progress, error, isLoading } = useProgress(sourceId)
  const { mutateAsync: retry, isPending: retrying } = useRetrySource()
  const [retryError, setRetryError] = useState('')
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedStr, setElapsedStr] = useState('0:00')
  const logRef = useRef(null)
  const isAutoscrolling = useRef(true)

  // Capture start time on first load for sourceId
  useEffect(() => {
    setStartedAt(new Date().toISOString())
  }, [sourceId])

  // Elapsed timer
  useEffect(() => {
    if (!startedAt) return
    const tick = () => setElapsedStr(formatElapsed(startedAt))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const handleRetry = async () => {
    setRetryError('')
    try {
      await retry(sourceId)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setRetryError('Maximum retry attempts reached for this source.')
      } else {
        setRetryError(err.message || 'Retry failed.')
      }
    }
  }

  const isCompleted = (progress?.percentage === 100 && !progress?.error_message) || progress?.status === 'completed'
  const isFailed = !!progress?.error_message || progress?.status === 'failed' || progress?.current_agent === 'Failed'
  const currentStage = agentToStage(progress?.current_agent)

  if (isLoading) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ height: '20px', width: '200px', borderRadius: '6px', marginBottom: '16px' }} className="skeleton" />
        <div style={{ height: '14px', width: '300px', borderRadius: '6px', marginBottom: '32px' }} className="skeleton" />
        <div style={{ height: '80px', borderRadius: '8px' }} className="skeleton" />
      </div>
    )
  }

  if (error && !progress) {
    return (
      <div style={{ padding: '40px' }}>
        <p style={{ color: 'var(--destructive)', fontSize: '14px' }}>
          Can't reach the server. Check your connection and try again.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            marginBottom: '4px',
          }}>
            {isCompleted ? 'Your notes are ready' : 'Creating your notes'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
            {isCompleted
              ? 'All topics have been processed and saved.'
              : isFailed
              ? 'Something went wrong during processing.'
              : 'You can leave this page. We\'ll keep working.'}
          </p>
        </div>
        <span style={{
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          marginTop: '4px',
        }}>
          {elapsedStr}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '2px',
        backgroundColor: 'var(--border)',
        borderRadius: '1px',
        marginBottom: '32px',
        overflow: 'hidden',
      }}>
        <div
          style={{
            height: '100%',
            width: `${progress?.percentage ?? 0}%`,
            backgroundColor: isFailed ? 'var(--destructive)' : 'var(--primary)',
            transition: 'width 0.6s ease-out',
          }}
          role="progressbar"
          aria-valuenow={progress?.percentage ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Pipeline progress"
        />
      </div>

      {/* Zone A: Pipeline flow */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>
          Pipeline
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
          overflowX: 'auto',
          paddingBottom: '8px',
        }}>
          {PIPELINE_STAGES.map((stage, i) => (
            <StageNode
              key={stage.key}
              stage={stage}
              status={getStageStatus(stage.key, progress?.current_agent, progress?.percentage, isCompleted ? 'completed' : isFailed ? 'failed' : 'processing')}
              isLast={i === PIPELINE_STAGES.length - 1}
            />
          ))}
        </div>

        {/* Current step description */}
        {!isCompleted && !isFailed && progress?.current_step && (
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '12px' }}>
            {progress.current_step}
          </p>
        )}
      </div>

      {/* Zone C: Activity log — driven by real polling */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Activity
          </p>
        </div>
        <div
          ref={logRef}
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
          }}
          onMouseEnter={() => { isAutoscrolling.current = false }}
          onMouseLeave={() => { isAutoscrolling.current = true }}
          aria-live="polite"
          aria-label="Pipeline activity"
        >
          {progress ? (
            <ActivityItem
              agent={progress.current_agent}
              step={progress.current_step}
              percentage={progress.percentage}
              retryCount={progress.retry_count}
              updatedAt={progress.updated_at}
              startedAt={startedAt}
            />
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Waiting for pipeline to start…</p>
          )}
          {progress?.message && progress.message !== progress.current_step && (
            <div style={{ padding: '8px 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              {progress.message}
            </div>
          )}
        </div>

        <TechnicalDetails progress={progress} />
      </div>

      {/* Error state */}
      {isFailed && (
        <div style={{
          border: '1px solid var(--destructive)',
          borderRadius: 'var(--radius-panel)',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--destructive)', marginBottom: '8px', fontWeight: 500 }}>
            We couldn't finish this one.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
            {progress?.error_message || 'An unexpected error occurred.'}
          </p>
          {retryError && (
            <p style={{ fontSize: '13px', color: 'var(--destructive)', marginBottom: '12px' }}>
              {retryError}
            </p>
          )}
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 16px',
              background: retrying ? 'var(--muted)' : 'var(--card)',
              color: retrying ? 'var(--muted-foreground)' : 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: retrying ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={e => { if (!retrying) e.currentTarget.style.background = 'var(--sunken)' }}
            onMouseLeave={e => { if (!retrying) e.currentTarget.style.background = 'var(--card)' }}
          >
            <RotateCw size={14} strokeWidth={1.5} />
            {retrying ? 'Retrying…' : 'Try again'}
          </button>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '8px' }}>
            Continues from where it stopped.
          </p>
        </div>
      )}

      {/* Done state CTA */}
      {isCompleted && (
        <Link
          to="/app/topics"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '36px',
            padding: '0 16px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius-control)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
        >
          <BookOpen size={16} strokeWidth={1.5} />
          Open notes
        </Link>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes marker-swipe {
          from { background-size: 0% 100%; }
          to { background-size: 100% 100%; }
        }
        @keyframes connector-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes spin { to { transform: none; } }
          @keyframes marker-swipe { to {} }
          @keyframes connector-fill { to {} }
        }
      `}</style>
    </div>
  )
}
