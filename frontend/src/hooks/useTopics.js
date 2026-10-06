import { useQuery } from '@tanstack/react-query'
import { getTopics, getTopicNote } from '@/api/topics'

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
    staleTime: 15000,
  })
}

export function useTopicNote(topicId) {
  return useQuery({
    queryKey: ['topic-note', topicId],
    queryFn: () => getTopicNote(topicId),
    enabled: !!topicId,
    staleTime: 30000,
  })
}
