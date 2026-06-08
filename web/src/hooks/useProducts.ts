'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { productsService, type ProductFilters } from '@/services/productsService'
import type { CreateProductInput, UpdateProductInput } from '@estoque/shared'

export function useProducts(filters: ProductFilters = {}, page = 1, all = false) {
  const query = useQuery({
    queryKey: ['products', filters, page, all],
    queryFn: () => productsService.list(filters, all ? 1 : page, all ? 5000 : 20),
  })
  return { ...query, data: query.data?.data ?? [], total: query.data?.total ?? 0 }
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductInput) => productsService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto criado com sucesso!')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao criar produto'),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productsService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto atualizado!')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao atualizar produto'),
  })
}

export function useInactivateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsService.inactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto inativado.')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao inativar produto'),
  })
}
