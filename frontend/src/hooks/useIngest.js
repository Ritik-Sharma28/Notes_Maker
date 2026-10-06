import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitIngest } from '@/api/ingest'

export function useIngest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitIngest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
    },
  })
}
