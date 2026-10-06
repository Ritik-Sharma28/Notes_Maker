import { useState, useMemo } from 'react'
import { Link, useParams, Outlet, useNavigate } from 'react-router-dom'
import { useTopics } from '@/hooks/useTopics'
import { buildTopicTree } from '@/lib/buildTopicTree'
import { ChevronRight, Search, FilePlus2, Loader } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

// ─── Topic tree row ───────────────────────────────────────────────────────────
function TopicRow({ topic, depth, isSelected, isExpanded, hasChildren, onToggle, query }) {
  const highlight = query && topic.title.toLowerCase().includes(query.toLowerCase())
  const titleStyle = highlight
    ? { backgroundColor: 'var(--marker)', borderRadius: '2px', padding: '0 2px' }
    : {}

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '32px',
        paddingLeft: `${12 + depth * 16}px`,
        paddingRight: '12px',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--background)' : 'transparent',
        borderLeft: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
        userSelect: 'none',
        gap: '4px',
        transition: 'background-color 0.1s',
        borderRadius: '0 var(--radius-control) var(--radius-control) 0',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--background)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {/* Toggle chevron */}
      {hasChildren ? (
        <button
          onClick={(e) => { e.preventDefault(); onToggle() }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          style={{
            width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
            color: 'var(--muted-foreground)',
          }}
        >
          <ChevronRight
            size={12}
            strokeWidth={1.5}
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s ease-out' }}
          />
        </button>
      ) : (
        <div style={{ width: '16px', flexShrink: 0 }} />
      )}

      {/* Title */}
      <Link
        to={`/app/topics/${topic.id}`}
        style={{
          flex: 1,
          fontSize: '14px',
          color: 'var(--foreground)',
          textDecoration: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: '32px',
        }}
      >
        <span style={titleStyle}>{topic.title}</span>
      </Link>

      {/* Dirty indicator */}
      {topic.is_dirty && (
        <span style={{
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0,
        }}>
          <Loader size={10} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
          Updating
        </span>
      )}

      {/* Recently updated marker */}
      {!topic.is_dirty && topic.updated_at && (() => {
        const diffHours = (new Date() - new Date(topic.updated_at)) / (1000 * 60 * 60)
        if (diffHours < 24) {
          return (
            <span style={{
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              backgroundColor: 'var(--marker)',
              borderRadius: '2px',
              padding: '0 4px',
              flexShrink: 0,
            }}>
              updated {formatRelativeTime(topic.updated_at)}
            </span>
          )
        }
        return null
      })()}
    </div>
  )
}

// ─── Recursive tree renderer ──────────────────────────────────────────────────
function TreeNode({ node, depth = 0, selectedId, expandedIds, onToggle, query }) {
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
      />
      {hasChildren && isExpanded && node.children.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onToggle={onToggle}
          query={query}
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
      // Flat filtered list for search
      const lower = query.toLowerCase()
      return topics
        .filter(t => t.title.toLowerCase().includes(lower))
        .map(t => ({ ...t, children: [] }))
    }
    return buildTopicTree(topics)
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

  const sidebar = (
    <div style={{
      width: '280px',
      minWidth: '280px',
      borderRight: '1px solid var(--border)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--background)',
      overflow: 'hidden',
    }}>
      {/* Search */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} strokeWidth={1.5} style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted-foreground)', pointerEvents: 'none',
          }} />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes"
            aria-label="Search notes"
            style={{
              width: '100%',
              height: '32px',
              paddingLeft: '32px',
              paddingRight: '8px',
              border: '1px solid var(--input)',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={e => e.target.style.outline = '2px solid var(--ring)'}
            onBlur={e => e.target.style.outline = 'none'}
          />
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {isLoading && (
          <div style={{ padding: '12px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: '32px', borderRadius: '6px', marginBottom: '4px', width: `${60 + Math.random() * 30}%` }} className="skeleton" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <p style={{ padding: '12px', fontSize: '13px', color: 'var(--destructive)' }}>
            Can't load notes. Check your connection.
          </p>
        )}

        {!isLoading && !error && tree.length === 0 && !query && (
          <div style={{ padding: '24px 16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.6 }}>
              No notes yet. Paste a ChatGPT conversation to create your first one.
            </p>
            <Link
              to="/app/ingest"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 12px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: 'var(--radius-control)',
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

        {!isLoading && !error && tree.length === 0 && query && (
          <p style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
            No notes match "{query}"
          </p>
        )}

        {!isLoading && !error && tree.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            selectedId={topicId}
            expandedIds={expandedIds}
            onToggle={toggleExpanded}
            query={query}
          />
        ))}
      </div>
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
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted-foreground)',
            fontSize: '14px',
          }}>
            {!isLoading && topics && topics.length > 0 && (
              <p>Select a topic to read its note.</p>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
