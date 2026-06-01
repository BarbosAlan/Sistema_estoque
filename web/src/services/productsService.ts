import type { Product } from '@estoque/shared'
import type { CreateProductInput, UpdateProductInput } from '@estoque/shared'

export type ProductWithCategory = Product & { category: { id: string; nome: string } | null }

export type ProductFilters = {
  search?: string
  categoria_id?: string
  status?: 'ativo' | 'inativo' | 'todos'
}

export const productsService = {
  async list(filters: ProductFilters = {}): Promise<ProductWithCategory[]> {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.categoria_id) params.set('categoria_id', filters.categoria_id)
    if (filters.status) params.set('status', filters.status)

    const res = await fetch(`/api/products?${params}`)
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar produtos')
    return json.data
  },

  async create(input: CreateProductInput): Promise<ProductWithCategory> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao criar produto')
    return json.data
  },

  async update(id: string, input: UpdateProductInput): Promise<ProductWithCategory> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao atualizar produto')
    return json.data
  },

  async inactivate(id: string): Promise<void> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao inativar produto')
  },
}
