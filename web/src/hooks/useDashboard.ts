import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '@/services/dashboardService'

export function useDashboard(dias = 30) {
  return useQuery({
    queryKey: ['dashboard', dias],
    queryFn: () => getDashboard(dias),
    refetchInterval: 60_000,
  })
}
