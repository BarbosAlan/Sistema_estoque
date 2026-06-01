import type { Category } from '@estoque/shared'

export const categoriesService = {
  async list(): Promise<Pick<Category, 'id' | 'nome'>[]> {
    const res = await fetch('/api/categories')
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar categorias')
    return json.data
  },
}
