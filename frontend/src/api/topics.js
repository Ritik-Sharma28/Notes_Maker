import { apiClient } from './client'

export async function getTopics() {
  return apiClient.get('/api/v1/topics')
}

export async function getTopicNote(topicId) {
  return apiClient.get(`/api/v1/topics/${topicId}/note`)
}
