export type AlertType = 'estoque_baixo' | 'sem_movimento' | 'zerado'

export interface Alert {
  id: string
  produto_id: string
  tipo_alerta: AlertType
  resolvido: boolean
  criado_em: string
}
