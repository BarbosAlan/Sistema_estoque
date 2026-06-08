import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const fornecedorSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(200),
  cnpj: z.string().max(18).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  telefone: z.string().max(20).optional().nullable(),
  observacao: z.string().max(1000).optional().nullable(),
})

export const GET = withAuth(['admin', 'estoquista', 'funcionario'], async (req) => {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1
  const ALLOWED_ORDER = ['nome', 'criado_em']
  const order_by = ALLOWED_ORDER.includes(searchParams.get('order_by') ?? '') ? searchParams.get('order_by')! : 'nome'
  const order_dir = searchParams.get('order_dir') === 'desc' ? false : true

  const supabase = await createServiceClient()

  let query = supabase
    .from('fornecedores')
    .select('*', { count: 'exact' })
    .eq('ativo', true)
    .order(order_by, { ascending: order_dir })

  if (search) query = query.ilike('nome', `%${search}%`)

  const { data, count, error } = await query.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count ?? 0 })
})

export const POST = withAuth(['admin', 'estoquista'], async (req) => {
  const body = fornecedorSchema.parse(await req.json())
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('fornecedores')
    .insert({
      nome: body.nome,
      cnpj: body.cnpj || null,
      email: body.email || null,
      telefone: body.telefone || null,
      observacao: body.observacao || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
})
