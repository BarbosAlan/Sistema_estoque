export type TipoAlerta = 'zerado' | 'estoque_baixo'

export function determinarTipoAlerta(
  quantidade_atual: number,
  quantidade_minima: number,
): TipoAlerta | null {
  if (quantidade_atual === 0) return 'zerado'
  if (quantidade_minima > 0 && quantidade_atual <= quantidade_minima) return 'estoque_baixo'
  return null
}
