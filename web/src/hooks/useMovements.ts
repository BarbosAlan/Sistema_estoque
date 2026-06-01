import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listMovements, createMovement, type MovementFilters } from '@/services/movementsService'

export function useMovements(filters: MovementFilters = {}) {
  return useQuery({
    queryKey: ['movements', filters],
    queryFn: () => listMovements(filters),
  })
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
