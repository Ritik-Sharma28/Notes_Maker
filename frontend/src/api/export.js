import { supabase } from '@/lib/supabase'

const BASE_URL = import.meta.env.VITE_API_URL || ''

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${session.access_token}` }
}

export async function getHtmlExport(topicId) {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${BASE_URL}/api/v1/export/${topicId}/html`, {
    headers: authHeader,
  })
  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  return res.text()
}

// PDF endpoint is NOT used in the UI
