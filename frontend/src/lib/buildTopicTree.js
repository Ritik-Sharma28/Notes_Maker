/**
 * Builds a topic tree from a flat list of topics with parent_topic_id.
 * Returns a list of root topics, each with a `children` array.
 */
export function buildTopicTree(topics) {
  if (!topics || topics.length === 0) return []

  const map = {}
  const roots = []

  // Create id → node map
  for (const topic of topics) {
    map[topic.id] = { ...topic, children: [] }
  }

  // Build tree
  for (const topic of topics) {
    if (topic.parent_topic_id && map[topic.parent_topic_id]) {
      map[topic.parent_topic_id].children.push(map[topic.id])
    } else {
      roots.push(map[topic.id])
    }
  }

  // Sort: alphabetical by title at each level
  function sortChildren(nodes) {
    nodes.sort((a, b) => a.title.localeCompare(b.title))
    for (const node of nodes) {
      if (node.children.length > 0) sortChildren(node.children)
    }
  }

  sortChildren(roots)
  return roots
}

/**
 * Flattens the tree into a list with depth info (for rendering).
 */
export function flattenTree(nodes, depth = 0) {
  const result = []
  for (const node of nodes) {
    result.push({ ...node, depth })
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1))
    }
  }
  return result
}

/**
 * Searches topics tree by title (case-insensitive).
 * Returns topics that match.
 */
export function searchTopics(topics, query) {
  if (!query.trim()) return topics
  const lower = query.toLowerCase()
  return topics.filter(t => t.title.toLowerCase().includes(lower))
}
