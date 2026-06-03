import { describe, it, expect } from 'vitest'
import { createMovementSchema } from '../movement.validators'

const VALID_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

describe('createMovementSchema', () => {
  const valid = {
    produto_id: VALID_UUID,
    tipo: 'entrada' as const,
    quantidade: 5,
  }

  it('aceita dados válidos', () => {
    expect(() => createMovementSchema.parse(valid)).not.toThrow()
  })

  it('aceita todos os tipos de movimentação', () => {
    const tipos = ['entrada', 'saida', 'ajuste_entrada', 'ajuste_saida'] as const
    for (const tipo of tipos) {
      expect(() => createMovementSchema.parse({ ...valid, tipo })).not.toThrow()
    }
  })

  it('rejeita produto_id que não é UUID', () => {
    expect(createMovementSchema.safeParse({ ...valid, produto_id: 'invalido' }).success).toBe(false)
  })

  it('rejeita quantidade zero', () => {
    expect(createMovementSchema.safeParse({ ...valid, quantidade: 0 }).success).toBe(false)
  })

  it('rejeita quantidade negativa', () => {
    expect(createMovementSchema.safeParse({ ...valid, quantidade: -1 }).success).toBe(false)
  })

  it('rejeita tipo inválido', () => {
    expect(createMovementSchema.safeParse({ ...valid, tipo: 'compra' }).success).toBe(false)
  })

  it('aceita motivo e observação opcionais', () => {
    expect(() => createMovementSchema.parse({
      ...valid,
      motivo: 'Compra mensal',
      observacao: 'NF 123',
    })).not.toThrow()
  })
})
