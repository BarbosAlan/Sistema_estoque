export interface Category {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  criado_em: string
}

export const categoriesService = {
  async list(): Promise<Category[]> {
    const res = await fetch('/api/categories')
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar categorias')
    return json.data
  },

  async create(input: { nome: string; descricao?: string | null }): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao criar categoria')
    return json.data
  },

  async update(id: string, input: { nome?: string; descricao?: string | null; ativo?: boolean }): Promise<Category> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao atualizar categoria')
    return json.data
  },

  async inactivate(id: string): Promise<void> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao remover categoria')
  },
}
