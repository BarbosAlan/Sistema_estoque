import { withAuth } from '@/lib/auth-middleware'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { updateProductSchema } from '@estoque/shared'
import { NextResponse } from 'next/server'

export const GET = withAuth(['admin', 'estoquista', 'funcionario'], async (_, __, { params }) => {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, nome), fornecedor:fornecedores(id, nome)')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
})

export const PATCH = withAuth(['admin', 'estoquista'], async (req, user, { params }) => {
  const { id } = await params
  const body = updateProductSchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = await createClient()

  const { data: current } = await supabase
    .from('products')
    .select('nome, status, valor_unitario, quantidade_minima')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('products')
    .update(body.data)
    .eq('id', id)
    .select('*, category:categories(id, nome), fornecedor:fornecedores(id, nome)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (current) {
    const logs: object[] = []
    const u = user.id
    const nome = current.nome

    if (body.data.status && body.data.status !== current.status) {
      logs.push({
        usuario_id: u,
        acao: body.data.status === 'inativo' ? 'produto.inativado' : 'produto.reativado',
        entidade_id: id,
        entidade_nome: nome,
        campo: 'status',
        valor_anterior: current.status,
        valor_novo: body.data.status,
      })
    }
    if (body.data.valor_unitario !== undefined && body.data.valor_unitario !== current.valor_unitario) {
      logs.push({
        usuario_id: u,
        acao: 'produto.preco_alterado',
        entidade_id: id,
        entidade_nome: nome,
        campo: 'valor_unitario',
        valor_anterior: String(current.valor_unitario ?? 0),
        valor_novo: String(body.data.valor_unitario),
      })
    }
    if (body.data.quantidade_minima !== undefined && body.data.quantidade_minima !== current.quantidade_minima) {
      logs.push({
        usuario_id: u,
        acao: 'produto.minimo_alterado',
        entidade_id: id,
        entidade_nome: nome,
        campo: 'quantidade_minima',
        valor_anterior: String(current.quantidade_minima),
        valor_novo: String(body.data.quantidade_minima),
      })
    }
    if (logs.length === 0) {
      logs.push({ usuario_id: u, acao: 'produto.atualizado', entidade_id: id, entidade_nome: nome })
    }
    const svc = await createServiceClient()
    await svc.from('audit_logs').insert(logs)
  }

  return NextResponse.json({ data })
})

export const DELETE = withAuth(['admin'], async (_, user, { params }) => {
  const { id } = await params
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('products')
    .select('nome')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('products')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (current) {
    const svc = await createServiceClient()
    await svc.from('audit_logs').insert({
      usuario_id: user.id,
      acao: 'produto.inativado',
      entidade_id: id,
      entidade_nome: current.nome,
      campo: 'status',
      valor_anterior: 'ativo',
      valor_novo: 'inativo',
    })
  }

  return NextResponse.json({ data: null }, { status: 200 })
})
