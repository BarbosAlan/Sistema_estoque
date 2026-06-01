import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'

export const GET = withAuth(['funcionario', 'estoquista', 'admin'], async () => {
  const supabase = await createServiceClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    { data: products },
    { count: movsHoje },
    { count: movesMes },
    { data: ultimasMovs },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, nome, codigo, unidade_medida, quantidade_atual, quantidade_minima')
      .eq('status', 'ativo'),
    supabase
      .from('movements')
      .select('*', { count: 'exact', head: true })
      .gte('criado_em', today.toISOString()),
    supabase
      .from('movements')
      .select('*', { count: 'exact', head: true })
      .gte('criado_em', firstOfMonth.toISOString()),
    supabase
      .from('movements')
      .select(`
        id, tipo, quantidade, criado_em,
        product:products(nome, codigo, unidade_medida),
        profile:profiles!movements_usuario_id_fkey(nome, username)
      `)
      .order('criado_em', { ascending: false })
      .limit(8),
  ])

  const list = products ?? []
  const totalProdutos = list.length
  const produtosAlerta = list.filter(p => p.quantidade_atual <= p.quantidade_minima && p.quantidade_atual > 0).length
  const produtosZerados = list.filter(p => p.quantidade_atual === 0).length
  const produtosCriticos = [...list]
    .sort((a, b) => (a.quantidade_atual / Math.max(a.quantidade_minima, 1)) - (b.quantidade_atual / Math.max(b.quantidade_minima, 1)))
    .slice(0, 6)

  return NextResponse.json({
    data: {
      totalProdutos,
      produtosAlerta,
      produtosZerados,
      movsHoje: movsHoje ?? 0,
      movesMes: movesMes ?? 0,
      ultimasMovs: ultimasMovs ?? [],
      produtosCriticos,
    },
  })
})
