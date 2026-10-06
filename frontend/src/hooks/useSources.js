import { useQuery } from '@tanstack/react-query'
import { getSources, retrySource } from '@/api/sources'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    staleTime: 10000,
  })
}

export function useRetrySource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sourceId) => retrySource(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
    },
  })
}
