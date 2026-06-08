'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fornecedoresService, type FornecedorInput } from '@/services/fornecedoresService'

export function useFornecedores(
  search = '',
  page = 1,
  order_by = 'nome',
  order_dir: 'asc' | 'desc' = 'asc',
) {
  const query = useQuery({
    queryKey: ['fornecedores', search, page, order_by, order_dir],
    queryFn: () => fornecedoresService.list(search, page, order_by, order_dir),
  })
  return { ...query, data: query.data?.data ?? [], total: query.data?.total ?? 0 }
}

export function useCreateFornecedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fornecedoresService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fornecedores'] })
      toast.success('Fornecedor criado!')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao criar fornecedor'),
  })
}

export function useUpdateFornecedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<FornecedorInput>) =>
      fornecedoresService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fornecedores'] })
      toast.success('Fornecedor atualizado!')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao atualizar fornecedor'),
  })
}

export function useInactivateFornecedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fornecedoresService.inactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fornecedores'] })
      toast.success('Fornecedor removido.')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao remover fornecedor'),
  })
}
