import type { MovementType } from '@estoque/shared'

export interface DashboardData {
  totalProdutos: number
  produtosAlerta: number
  produtosZerados: number
  movsHoje: number
  movesMes: number
  ultimasMovs: Array<{
    id: string
    tipo: MovementType
    quantidade: number
    criado_em: string
    product: { nome: string; codigo: string; unidade_medida: string } | null
    profile: { nome: string; username: string } | null
  }>
  produtosCriticos: Array<{
    id: string
    nome: string
    codigo: string
    unidade_medida: string
    quantidade_atual: number
    quantidade_minima: number
  }>
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao carregar dashboard')
  return json.data
}
