import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'

export const GET = withAuth(['estoquista', 'admin'], async () => {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, nome, codigo, unidade_medida, quantidade_atual, quantidade_minima, categoria_id, category:categories(nome)')
    .eq('status', 'ativo')
    .order('quantidade_atual', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const zerados = (data ?? []).filter(p => p.quantidade_atual === 0)
  const baixo = (data ?? []).filter(p => p.quantidade_atual > 0 && p.quantidade_atual <= p.quantidade_minima)

  return NextResponse.json({ data: { zerados, baixo } })
})
