import { describe, it, expect } from 'vitest'
import { determinarTipoAlerta } from './alertas'

describe('determinarTipoAlerta', () => {
  it('retorna zerado quando quantidade_atual é 0', () => {
    expect(determinarTipoAlerta(0, 10)).toBe('zerado')
    expect(determinarTipoAlerta(0, 0)).toBe('zerado')
  })

  it('retorna estoque_baixo quando atual <= mínimo (com mínimo > 0)', () => {
    expect(determinarTipoAlerta(5, 5)).toBe('estoque_baixo')
    expect(determinarTipoAlerta(3, 10)).toBe('estoque_baixo')
    expect(determinarTipoAlerta(1, 10)).toBe('estoque_baixo')
  })

  it('retorna null quando estoque está OK', () => {
    expect(determinarTipoAlerta(11, 10)).toBeNull()
    expect(determinarTipoAlerta(100, 10)).toBeNull()
  })

  it('retorna null quando mínimo é 0 e quantidade > 0', () => {
    expect(determinarTipoAlerta(5, 0)).toBeNull()
    expect(determinarTipoAlerta(1, 0)).toBeNull()
  })

  it('prioriza zerado sobre estoque_baixo quando quantidade é 0', () => {
    expect(determinarTipoAlerta(0, 10)).toBe('zerado')
  })
})
