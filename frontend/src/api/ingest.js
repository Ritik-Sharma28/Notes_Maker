import { apiClient } from './client'

export async function submitIngest({ shareUrl, rawText }) {
  const body = {}
  if (shareUrl) body.share_url = shareUrl
  if (rawText) body.raw_text = rawText
  return apiClient.post('/api/v1/ingest', body)
}
