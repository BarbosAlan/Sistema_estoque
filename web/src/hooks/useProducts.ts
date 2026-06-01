'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsService, type ProductFilters } from '@/services/productsService'
import type { CreateProductInput, UpdateProductInput } from '@estoque/shared'

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsService.list(filters),
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductInput) => productsService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productsService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useInactivateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsService.inactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
