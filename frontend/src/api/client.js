import { supabase } from '@/lib/supabase'

const BASE_URL = import.meta.env.VITE_API_URL || ''

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new ApiError('Not authenticated', 401, null)
  }
  return { Authorization: `Bearer ${session.access_token}` }
}

async function request(method, path, body = null, options = {}) {
  const authHeader = await getAuthHeader()

  const headers = {
    'Content-Type': 'application/json',
    ...authHeader,
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    await supabase.auth.signOut()
    window.location.href = '/login?reason=session_expired'
    throw new ApiError('Session expired', 401, null)
  }

  if (!res.ok) {
    let errorData = null
    try {
      errorData = await res.json()
    } catch {}
    throw new ApiError(
      errorData?.detail || `Request failed: ${res.status}`,
      res.status,
      errorData
    )
  }

  // Handle HTML response (export)
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    return res.text()
  }

  // Handle empty response
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}

export const apiClient = {
  get: (path, options) => request('GET', path, null, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  delete: (path, options) => request('DELETE', path, null, options),
}

export { ApiError }
