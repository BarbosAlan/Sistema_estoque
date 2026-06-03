import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listMovements, createMovement, type MovementFilters } from '@/services/movementsService'

export function useMovements(filters: MovementFilters = {}, page = 1) {
  const query = useQuery({
    queryKey: ['movements', filters, page],
    queryFn: () => listMovements(filters, page),
  })
  return { ...query, data: query.data?.data ?? [], total: query.data?.total ?? 0 }
}

export function useCreateMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMovement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
