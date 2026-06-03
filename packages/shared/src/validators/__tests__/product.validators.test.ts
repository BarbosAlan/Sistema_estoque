import { describe, it, expect } from 'vitest'
import { createProductSchema, updateProductSchema } from '../product.validators'

const VALID_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

describe('createProductSchema', () => {
  const valid = {
    codigo: 'PROD-001',
    nome: 'Papel A4',
    categoria_id: VALID_UUID,
    unidade_medida: 'resma',
    quantidade_minima: 10,
  }

  it('aceita dados válidos', () => {
    expect(() => createProductSchema.parse(valid)).not.toThrow()
  })

  it('rejeita código vazio', () => {
    expect(createProductSchema.safeParse({ ...valid, codigo: '' }).success).toBe(false)
  })

  it('rejeita nome vazio', () => {
    expect(createProductSchema.safeParse({ ...valid, nome: '' }).success).toBe(false)
  })

  it('rejeita categoria_id que não é UUID', () => {
    expect(createProductSchema.safeParse({ ...valid, categoria_id: 'invalido' }).success).toBe(false)
  })

  it('aceita quantidade_minima zero', () => {
    expect(() => createProductSchema.parse({ ...valid, quantidade_minima: 0 })).not.toThrow()
  })

  it('rejeita quantidade_minima negativa', () => {
    expect(createProductSchema.safeParse({ ...valid, quantidade_minima: -1 }).success).toBe(false)
  })

  it('aceita campos opcionais ausentes', () => {
    expect(() => createProductSchema.parse(valid)).not.toThrow()
  })
})

describe('updateProductSchema', () => {
  it('aceita atualização parcial', () => {
    expect(updateProductSchema.safeParse({ nome: 'Novo Nome' }).success).toBe(true)
  })

  it('aceita status ativo', () => {
    expect(updateProductSchema.safeParse({ status: 'ativo' }).success).toBe(true)
  })

  it('aceita status inativo', () => {
    expect(updateProductSchema.safeParse({ status: 'inativo' }).success).toBe(true)
  })

  it('rejeita status inválido', () => {
    expect(updateProductSchema.safeParse({ status: 'deletado' }).success).toBe(false)
  })

  it('aceita objeto vazio (sem campos obrigatórios)', () => {
    expect(updateProductSchema.safeParse({}).success).toBe(true)
  })
})
