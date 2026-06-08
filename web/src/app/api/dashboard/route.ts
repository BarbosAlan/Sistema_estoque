import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'

function buildChartData(movs: Array<{ tipo: string; quantidade: number; criado_em: string }>) {
  const dateMap = new Map<string, { display: string; entradas: number; saidas: number; transferencias: number }>()

  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const isoKey = d.toISOString().slice(0, 10)
    const display = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    dateMap.set(isoKey, { display, entradas: 0, saidas: 0, transferencias: 0 })
  }

  for (const m of movs) {
    const isoKey = m.criado_em.slice(0, 10)
    const entry = dateMap.get(isoKey)
    if (entry) {
      if (m.tipo === 'entrada') entry.entradas += m.quantidade
      else if (m.tipo === 'saida') entry.saidas += m.quantidade
      else entry.transferencias += m.quantidade
    }
  }

  return Array.from(dateMap.values()).map(({ display, entradas, saidas, transferencias }) => ({
    date: display,
    entradas,
    saidas,
    transferencias,
  }))
}

export const GET = withAuth(['funcionario', 'estoquista', 'admin'], async () => {
  const supabase = await createServiceClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const [
    { data: products },
    { data: categorias },
    { count: movsHoje },
    { count: movesMes },
    { data: ultimasMovs },
    { data: movsChart },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, nome, codigo, unidade_medida, quantidade_atual, quantidade_minima, categoria_id, valor_unitario')
      .eq('status', 'ativo'),
    supabase.from('categories').select('id, nome').eq('ativo', true),
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
      .eq('tipo', 'entrada')
      .order('criado_em', { ascending: false })
      .limit(5),
    supabase
      .from('movements')
      .select('tipo, quantidade, criado_em')
      .gte('criado_em', thirtyDaysAgo.toISOString()),
  ])

  const list = products ?? []
  const catList = categorias ?? []
  const catMap = new Map(catList.map(c => [c.id, c.nome]))

  const totalProdutos = list.length
  const produtosAlerta = list.filter(p => p.quantidade_atual <= p.quantidade_minima && p.quantidade_atual > 0).length
  const produtosZerados = list.filter(p => p.quantidade_atual === 0).length
  const valorEstoque = list.reduce((acc, p) => acc + p.quantidade_atual * (p.valor_unitario ?? 0), 0)

  const categoriasStats = catList
    .map(cat => {
      const catProducts = list.filter(p => p.categoria_id === cat.id)
      const total = catProducts.length
      const saudaveis = catProducts.filter(p => p.quantidade_atual > p.quantidade_minima).length
      const valorTotal = catProducts.reduce((acc, p) => acc + p.quantidade_atual * (p.valor_unitario ?? 0), 0)
      return {
        id: cat.id,
        nome: cat.nome,
        total,
        valorTotal,
        percentualSaudavel: total > 0 ? Math.round((saudaveis / total) * 100) : 100,
      }
    })
    .filter(c => c.total > 0)

  const produtosCriticos = [...list]
    .sort(
      (a, b) =>
        a.quantidade_atual / Math.max(a.quantidade_minima, 1) -
        b.quantidade_atual / Math.max(b.quantidade_minima, 1),
    )
    .slice(0, 6)
    .map(p => ({ ...p, categoria_nome: catMap.get(p.categoria_id) ?? '—' }))

  return NextResponse.json({
    data: {
      totalProdutos,
      valorEstoque,
      produtosAlerta,
      produtosZerados,
      movsHoje: movsHoje ?? 0,
      movesMes: movesMes ?? 0,
      categorias: categoriasStats,
      chartData: buildChartData(movsChart ?? []),
      ultimasMovs: ultimasMovs ?? [],
      produtosCriticos,
    },
  })
})
