import { withAuth } from '@/lib/auth-middleware'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(100),
  descricao: z.string().max(500).optional().nullable(),
})

export const GET = withAuth(['admin', 'estoquista', 'funcionario'], async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, nome, descricao, ativo, criado_em')
    .order('nome')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
})

export const POST = withAuth(['admin', 'estoquista'], async (req) => {
  const body = categoriaSchema.parse(await req.json())
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('categories')
    .insert({ nome: body.nome, descricao: body.descricao ?? null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Já existe uma categoria com esse nome' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
})
