'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { categoriesService } from '@/services/categoriesService'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.list(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria criada!')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao criar categoria'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; nome?: string; descricao?: string | null; ativo?: boolean }) =>
      categoriesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria atualizada!')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao atualizar categoria'),
  })
}

export function useInactivateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: categoriesService.inactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria removida.')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao remover categoria'),
  })
}
