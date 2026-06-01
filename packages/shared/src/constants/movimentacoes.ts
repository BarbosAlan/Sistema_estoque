import type { MovementType } from '../types/movement.types'

export const TIPOS_MOVIMENTACAO: Record<MovementType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste_entrada: 'Ajuste de Entrada',
  ajuste_saida: 'Ajuste de Saída',
}
