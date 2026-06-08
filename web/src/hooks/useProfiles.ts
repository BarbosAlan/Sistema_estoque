'use client'

import { useQuery } from '@tanstack/react-query'

export interface Profile {
  id: string
  nome: string
  username: string
}

export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const res = await fetch('/api/profiles')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar usuários')
      return json.data as Profile[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
