export type MovementType = 'entrada' | 'saida' | 'ajuste_entrada' | 'ajuste_saida'

export interface Movement {
  id: string
  produto_id: string
  usuario_id: string
  tipo: MovementType
  quantidade: number
  motivo: string | null
  observacao: string | null
  criado_em: string
}
