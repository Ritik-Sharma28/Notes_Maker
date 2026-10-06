import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProgress } from '@/api/progress'

export function useProgress(sourceId) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['progress', sourceId],
    queryFn: () => getProgress(sourceId),
    enabled: !!sourceId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 1500
      const isDone = data.current_agent === null ||
        data.percentage === 100 ||
        data.error_message
      if (isDone) {
        // Invalidate topics and sources when done
        queryClient.invalidateQueries({ queryKey: ['topics'] })
        queryClient.invalidateQueries({ queryKey: ['sources'] })
        return false
      }
      return 1500
    },
    refetchIntervalInBackground: true,
  })
}
