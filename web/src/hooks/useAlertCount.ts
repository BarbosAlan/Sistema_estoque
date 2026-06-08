'use client'

import { useQuery } from '@tanstack/react-query'

async function fetchAlertCount(): Promise<number> {
  const res = await fetch('/api/alerts')
  if (!res.ok) return 0
  const { data } = await res.json()
  return (data?.zerados?.length ?? 0) + (data?.baixo?.length ?? 0)
}

export function useAlertCount() {
  return useQuery({
    queryKey: ['alert-count'],
    queryFn: fetchAlertCount,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
