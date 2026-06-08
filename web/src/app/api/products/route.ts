import { withAuth } from '@/lib/auth-middleware'
import { createClient } from '@/lib/supabase-server'
import { createProductSchema } from '@estoque/shared'
import { NextResponse } from 'next/server'

export const GET = withAuth(['admin', 'estoquista', 'funcionario'], async (req) => {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const categoria_id = searchParams.get('categoria_id') ?? ''
  const fornecedor_id = searchParams.get('fornecedor_id') ?? ''
  const status = searchParams.get('status') ?? 'ativo'
  const ALLOWED_ORDER = ['nome', 'codigo', 'quantidade_atual', 'quantidade_minima', 'valor_unitario', 'criado_em']
  const order_by = ALLOWED_ORDER.includes(searchParams.get('order_by') ?? '') ? searchParams.get('order_by')! : 'nome'
  const order_dir = searchParams.get('order_dir') === 'desc' ? false : true

  const supabase = await createClient()

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit') ?? '20')), 5000)
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('products')
    .select('*, category:categories(id, nome), fornecedor:fornecedores(id, nome)', { count: 'exact' })
    .order(order_by, { ascending: order_dir })

  if (status !== 'todos') query = query.eq('status', status)
  if (categoria_id) query = query.eq('categoria_id', categoria_id)
  if (fornecedor_id) query = query.eq('fornecedor_id', fornecedor_id)
  if (search) query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`)

  const { data, count, error } = await query.range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count ?? 0 })
})

export const POST = withAuth(['admin', 'estoquista'], async (req) => {
  const body = createProductSchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert(body.data)
    .select('*, category:categories(id, nome), fornecedor:fornecedores(id, nome)')
    .single()

  if (error) {
    const msg = error.message.includes('unique') ? 'Código já cadastrado.' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  return NextResponse.json({ data }, { status: 201 })
})
