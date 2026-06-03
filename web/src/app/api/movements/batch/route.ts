import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const batchSchema = z.object({
  items: z.array(z.object({
    produto_id: z.string().uuid('ID de produto inválido'),
    quantidade: z.number().int().min(1, 'Quantidade deve ser maior que zero'),
    motivo: z.string().optional(),
  })).min(1, 'Informe ao menos um produto').max(50),
})

export const POST = withAuth(['funcionario', 'estoquista', 'admin'], async (req, user) => {
  const body = batchSchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = await createServiceClient()
  const { error } = await supabase.rpc('registrar_movimentos_lote', {
    p_itens: body.data.items,
    p_usuario_id: user.id,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true }, { status: 201 })
})
