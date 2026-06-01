import { useQuery } from '@tanstack/react-query'
import { getAlerts } from '@/services/alertsService'

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 60_000,
  })
}
