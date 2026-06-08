export interface Fornecedor {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  observacao: string | null
  ativo: boolean
  criado_em: string
}

export interface FornecedorInput {
  nome: string
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
  observacao?: string | null
}

export const fornecedoresService = {
  async list(search = '', page = 1, order_by = 'nome', order_dir: 'asc' | 'desc' = 'asc'): Promise<{ data: Fornecedor[]; total: number }> {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(page))
    params.set('order_by', order_by)
    params.set('order_dir', order_dir)

    const res = await fetch(`/api/fornecedores?${params}`)
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar fornecedores')
    return { data: json.data, total: json.total ?? 0 }
  },

  async create(input: FornecedorInput): Promise<Fornecedor> {
    const res = await fetch('/api/fornecedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao criar fornecedor')
    return json.data
  },

  async update(id: string, input: Partial<FornecedorInput>): Promise<Fornecedor> {
    const res = await fetch(`/api/fornecedores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao atualizar fornecedor')
    return json.data
  },

  async inactivate(id: string): Promise<void> {
    const res = await fetch(`/api/fornecedores/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao remover fornecedor')
  },
}
