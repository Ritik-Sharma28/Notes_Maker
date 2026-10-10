import { useState, useMemo } from 'react'
import { Link, useParams, Outlet, useNavigate } from 'react-router-dom'
import { useTopics } from '@/hooks/useTopics'
import { buildTopicTree } from '@/lib/buildTopicTree'
import { ChevronRight, Search, FilePlus2, Loader, Clock, Hash, FolderOpen, Folder, X } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

// ─── Topic row ───────────────────────────────────────────────────────────────
function TopicRow({ topic, depth, isSelected, isExpanded, hasChildren, onToggle, query, index }) {
  const highlight = query && topic.title.toLowerCase().includes(query.toLowerCase())

  const isNew = topic.updated_at && (() => {
    const diffHours = (new Date() - new Date(topic.updated_at)) / (1000 * 60 * 60)
    return diffHours < 24
  })()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '36px',
        paddingLeft: `${8 + depth * 14}px`,
        paddingRight: '8px',
        paddingTop: '2px',
        paddingBottom: '2px',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--primary-soft)' : 'transparent',
        borderRadius: '8px',
        userSelect: 'none',
        gap: '4px',
        transition: 'background-color 0.1s',
        position: 'relative',
        margin: '1px 4px',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--hover-bg)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {/* Toggle chevron */}
      {hasChildren ? (
        <button
          onClick={(e) => { e.preventDefault(); onToggle() }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          style={{
            width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
            color: 'var(--muted-foreground)', borderRadius: '4px',
          }}
        >
          {isExpanded
            ? <FolderOpen size={13} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            : <Folder size={13} strokeWidth={1.5} style={{ color: 'var(--muted-foreground)' }} />
          }
        </button>
      ) : (
        <div style={{ width: '18px', height: '18px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isSelected ? 'var(--primary)' : 'var(--border)' }} />
        </div>
      )}

      {/* Title */}
      <Link
        to={`/app/topics/${topic.id}`}
        style={{
          flex: 1,
          fontSize: '13.5px',
          color: isSelected ? 'var(--primary)' : 'var(--foreground)',
          textDecoration: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: '20px',
          fontWeight: isSelected ? 500 : 400,
        }}
      >
        {highlight && query ? (
          <>
            {topic.title.split(new RegExp(`(${query})`, 'gi')).map((part, i) =>
              part.toLowerCase() === query.toLowerCase()
                ? <mark key={i} style={{ background: 'var(--marker)', borderRadius: '2px', padding: '0 1px', color: 'var(--foreground)' }}>{part}</mark>
                : part
            )}
          </>
        ) : topic.title}
      </Link>

      {/* Dirty indicator */}
      {topic.is_dirty && (
        <Loader size={10} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite', color: 'var(--muted-foreground)', flexShrink: 0 }} />
      )}

      {/* New badge */}
      {!topic.is_dirty && isNew && (
        <span style={{
          fontSize: '10px',
          color: 'var(--primary)',
          backgroundColor: 'var(--primary-soft)',
          borderRadius: '4px',
          padding: '1px 5px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          flexShrink: 0,
          textTransform: 'uppercase',
        }}>
          new
        </span>
      )}
    </div>
  )
}

// ─── Recursive tree renderer ──────────────────────────────────────────────────
function TreeNode({ node, depth = 0, selectedId, expandedIds, onToggle, query, flatIndex }) {
  const isExpanded = expandedIds.has(node.id)
  const isSelected = node.id === selectedId
  const hasChildren = node.children && node.children.length > 0

  return (
    <>
      <TopicRow
        topic={node}
        depth={depth}
        isSelected={isSelected}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        onToggle={() => onToggle(node.id)}
        query={query}
        index={flatIndex}
      />
      {hasChildren && isExpanded && node.children.map((child, i) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onToggle={onToggle}
          query={query}
          flatIndex={flatIndex + i + 1}
        />
      ))}
    </>
  )
}

// ─── Topics page ──────────────────────────────────────────────────────────────
export default function Topics() {
  const { topicId } = useParams()
  const { data: topics, isLoading, error } = useTopics()
  const [query, setQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const navigate = useNavigate()

  const tree = useMemo(() => {
    if (!topics) return []
    if (query.trim()) {
      const lower = query.toLowerCase()
      return topics
        .filter(t => t.title.toLowerCase().includes(lower))
        .map(t => ({ ...t, children: [] }))
    }
    return buildTopicTree(topics)
  }, [topics, query])

  // Recent notes (updated in last 7 days), shown at top when not searching
  const recentTopics = useMemo(() => {
    if (!topics || query.trim()) return []
    return [...topics]
      .filter(t => t.updated_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
  }, [topics, query])

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Auto-expand parent of selected topic
  useMemo(() => {
    if (!topicId || !topics) return
    const selected = topics.find(t => t.id === topicId)
    if (selected?.parent_topic_id) {
      setExpandedIds(prev => new Set([...prev, selected.parent_topic_id]))
    }
  }, [topicId, topics])

  const totalCount = topics?.length ?? 0
  const matchCount = query.trim() ? tree.length : totalCount

  const sidebar = (
    <div style={{
      width: '288px',
      minWidth: '288px',
      borderRight: '1px solid var(--border)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--background)',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 16px 0',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
              Notes
            </span>
            {!isLoading && totalCount > 0 && (
              <span style={{
                fontSize: '11px',
                color: 'var(--muted-foreground)',
                backgroundColor: 'var(--sunken)',
                borderRadius: '10px',
                padding: '1px 7px',
                fontWeight: 500,
              }}>
                {totalCount}
              </span>
            )}
          </div>
          <Link
            to="/app/ingest"
            title="New notes"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '28px',
              padding: '0 10px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'background 0.12s, transform 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <FilePlus2 size={12} strokeWidth={2} />
            New
          </Link>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '4px' }}>
          <Search size={13} strokeWidth={1.5} style={{
            position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted-foreground)', pointerEvents: 'none',
          }} />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes…"
            aria-label="Search notes"
            style={{
              width: '100%',
              height: '32px',
              paddingLeft: '30px',
              paddingRight: query ? '28px' : '8px',
              border: '1px solid var(--border)',
              borderRadius: '7px',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--ring)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--ring) 15%, transparent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center',
                borderRadius: '3px',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Search result count */}
        {query.trim() && (
          <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', padding: '4px 2px 8px', margin: 0 }}>
            {matchCount === 0 ? 'No results' : `${matchCount} result${matchCount !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '8px 0 0' }} />

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 16px' }} className="topics-scroll">

        {/* Loading skeleton */}
        {isLoading && (
          <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{
                height: '32px', borderRadius: '8px',
                width: `${55 + (i % 3) * 15}%`,
              }} />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <p style={{ padding: '16px', fontSize: '13px', color: 'var(--destructive)', lineHeight: 1.5 }}>
            Can't load notes. Check your connection.
          </p>
        )}

        {/* Empty */}
        {!isLoading && !error && tree.length === 0 && !query && (
          <div style={{ padding: '32px 20px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              backgroundColor: 'var(--sunken)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '16px',
            }}>
              <Hash size={20} strokeWidth={1.5} color="var(--muted-foreground)" />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 500, marginBottom: '6px' }}>
              No notes yet
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '20px', lineHeight: 1.5 }}>
              Paste a ChatGPT conversation to create your first one.
            </p>
            <Link
              to="/app/ingest"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 14px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: '7px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <FilePlus2 size={14} strokeWidth={1.5} />
              New notes
            </Link>
          </div>
        )}

        {/* No search results */}
        {!isLoading && !error && tree.length === 0 && query && (
          <div style={{ padding: '24px 20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
              No notes matching <strong style={{ color: 'var(--foreground)' }}>"{query}"</strong>
            </p>
          </div>
        )}

        {/* Recent notes section */}
        {!isLoading && !error && !query && recentTopics.length > 0 && (
          <div style={{ marginBottom: '4px' }}>
            <div style={{
              padding: '8px 16px 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <Clock size={10} strokeWidth={2} color="var(--muted-foreground)" />
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}>
                Recent
              </span>
            </div>
            {recentTopics.map((topic, i) => (
              <div key={topic.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px 5px 16px',
                margin: '1px 4px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: topicId === topic.id ? 'var(--primary-soft)' : 'transparent',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => { if (topicId !== topic.id) e.currentTarget.style.backgroundColor = 'var(--hover-bg)' }}
                onMouseLeave={e => { if (topicId !== topic.id) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span style={{
                  fontSize: '10px',
                  color: 'var(--muted-foreground)',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '16px',
                  textAlign: 'right',
                  fontWeight: 500,
                }}>
                  {i + 1}
                </span>
                <Link
                  to={`/app/topics/${topic.id}`}
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    color: topicId === topic.id ? 'var(--primary)' : 'var(--foreground)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: topicId === topic.id ? 500 : 400,
                  }}
                >
                  {topic.title}
                </Link>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--muted-foreground)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}>
                  {formatRelativeTime(topic.updated_at)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Divider between sections */}
        {!isLoading && !error && !query && recentTopics.length > 0 && tree.length > 0 && (
          <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '8px 16px' }} />
        )}

        {/* All notes section */}
        {!isLoading && !error && tree.length > 0 && (
          <div>
            {!query && (
              <div style={{
                padding: '8px 16px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <Hash size={10} strokeWidth={2} color="var(--muted-foreground)" />
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}>
                  All notes
                </span>
              </div>
            )}
            {tree.map((node, i) => (
              <TreeNode
                key={node.id}
                node={node}
                selectedId={topicId}
                expandedIds={expandedIds}
                onToggle={toggleExpanded}
                query={query}
                flatIndex={i}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: topic tree */}
      {sidebar}

      {/* Right: note reader or empty state */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {topicId ? (
          <Outlet />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted-foreground)',
            gap: '12px',
          }}>
            {!isLoading && topics && topics.length > 0 && (
              <>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  backgroundColor: 'var(--sunken)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: '4px',
                }}>
                  <Hash size={24} strokeWidth={1.5} color="var(--muted-foreground)" />
                </div>
                <p style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 500, margin: 0 }}>
                  Pick a note to read
                </p>
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>
                  Select any note from the sidebar
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
