import { z } from 'zod'

export const createProductSchema = z.object({
  codigo: z.string().min(1, 'Código obrigatório'),
  nome: z.string().min(1, 'Nome obrigatório'),
  categoria_id: z.string().uuid('Categoria inválida'),
  descricao: z.string().optional(),
  unidade_medida: z.string().min(1, 'Unidade obrigatória'),
  quantidade_minima: z.number().int().min(0),
  localizacao: z.string().optional(),
})

export const updateProductSchema = createProductSchema.partial().extend({
  status: z.enum(['ativo', 'inativo']).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
