import { z } from 'zod'

export const createMovementSchema = z.object({
  produto_id: z.string().uuid('Produto inválido'),
  tipo: z.enum(['entrada', 'saida', 'ajuste_entrada', 'ajuste_saida']),
  quantidade: z.number().int().min(1, 'Quantidade deve ser maior que zero'),
  motivo: z.string().optional(),
  observacao: z.string().optional(),
})

export type CreateMovementInput = z.infer<typeof createMovementSchema>
