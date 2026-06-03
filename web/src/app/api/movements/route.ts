import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { createMovementSchema } from '@estoque/shared'

export const GET = withAuth(['funcionario', 'estoquista', 'admin'], async (req) => {
  const { searchParams } = new URL(req.url)
  const produto_id = searchParams.get('produto_id') || ''
  const tipo = searchParams.get('tipo') || ''
  const from_date = searchParams.get('from_date') || ''
  const to_date = searchParams.get('to_date') || ''

  const search = searchParams.get('search') || ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabase = await createServiceClient()

  let produtoIds: string[] | null = null
  if (search) {
    const { data: matched } = await supabase
      .from('products')
      .select('id')
      .or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`)
    produtoIds = matched?.map(p => p.id) ?? []
    if (produtoIds.length === 0) {
      return NextResponse.json({ data: [], total: 0 })
    }
  }

  let query = supabase
    .from('movements')
    .select(`
      *,
      product:products(id, nome, codigo, unidade_medida),
      profile:profiles!movements_usuario_id_fkey(id, nome, username)
    `, { count: 'exact' })
    .order('criado_em', { ascending: false })

  if (produtoIds) query = query.in('produto_id', produtoIds)
  if (produto_id) query = query.eq('produto_id', produto_id)
  if (tipo) query = query.eq('tipo', tipo)
  if (from_date) query = query.gte('criado_em', from_date)
  if (to_date) query = query.lte('criado_em', to_date + 'T23:59:59Z')

  const { data, count, error } = await query.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count ?? 0 })
})

export const POST = withAuth(['funcionario', 'estoquista', 'admin'], async (req, user) => {
  const body = createMovementSchema.parse(await req.json())
  const supabase = await createServiceClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, nome, quantidade_atual, status')
    .eq('id', body.produto_id)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }
  if (product.status === 'inativo') {
    return NextResponse.json({ error: 'Produto inativo não pode ter movimentação' }, { status: 400 })
  }

  const isEntrada = ['entrada', 'ajuste_entrada'].includes(body.tipo)
  const novaQtd = isEntrada
    ? product.quantidade_atual + body.quantidade
    : product.quantidade_atual - body.quantidade

  if (!isEntrada && novaQtd < 0) {
    return NextResponse.json(
      { error: `Estoque insuficiente. Disponível: ${product.quantidade_atual}` },
      { status: 400 }
    )
  }

  const { data: movement, error: movErr } = await supabase
    .from('movements')
    .insert({
      produto_id: body.produto_id,
      usuario_id: user.id,
      tipo: body.tipo,
      quantidade: body.quantidade,
      motivo: body.motivo ?? null,
      observacao: body.observacao ?? null,
    })
    .select()
    .single()

  if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 })

  await supabase
    .from('products')
    .update({ quantidade_atual: novaQtd })
    .eq('id', body.produto_id)

  return NextResponse.json({ data: movement }, { status: 201 })
})
