import type { CreateMovementInput } from '@estoque/shared'
import type { MovementType } from '@estoque/shared'

export interface MovementWithRelations {
  id: string
  produto_id: string
  usuario_id: string
  tipo: MovementType
  quantidade: number
  motivo: string | null
  observacao: string | null
  criado_em: string
  product: { id: string; nome: string; codigo: string; unidade_medida: string } | null
  profile: { id: string; nome: string; username: string } | null
}

export interface MovementFilters {
  produto_id?: string
  usuario_id?: string
  tipo?: string
  from_date?: string
  to_date?: string
  search?: string
  order_dir?: 'asc' | 'desc'
}

export async function listMovements(
  filters: MovementFilters = {},
  page = 1,
): Promise<{ data: MovementWithRelations[]; total: number }> {
  const params = new URLSearchParams()
  if (filters.produto_id) params.set('produto_id', filters.produto_id)
  if (filters.usuario_id) params.set('usuario_id', filters.usuario_id)
  if (filters.tipo) params.set('tipo', filters.tipo)
  if (filters.from_date) params.set('from_date', filters.from_date)
  if (filters.to_date) params.set('to_date', filters.to_date)
  if (filters.search) params.set('search', filters.search)
  if (filters.order_dir) params.set('order_dir', filters.order_dir)
  params.set('page', String(page))

  const res = await fetch(`/api/movements?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao listar movimentações')
  return { data: json.data, total: json.total ?? 0 }
}

export async function createMovement(input: CreateMovementInput): Promise<void> {
  const res = await fetch('/api/movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao registrar movimentação')
}
