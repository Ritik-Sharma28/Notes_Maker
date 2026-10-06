import { apiClient } from './client'

export async function getSources() {
  return apiClient.get('/api/v1/sources')
}

export async function retrySource(sourceId) {
  return apiClient.post(`/api/v1/sources/${sourceId}/retry`)
}
