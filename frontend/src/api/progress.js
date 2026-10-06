import { apiClient } from './client'

export async function getProgress(sourceId) {
  return apiClient.get(`/api/v1/sources/${sourceId}/progress`)
}

export async function getSourceStatus(sourceId) {
  return apiClient.get(`/api/v1/sources/${sourceId}/status`)
}
