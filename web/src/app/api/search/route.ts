import { withAuth } from '@/lib/auth-middleware'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const GET = withAuth(['admin', 'estoquista', 'funcionario'], async (req) => {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ produtos: [], fornecedores: [], categorias: [] })

  const supabase = await createClient()
  const pattern = `%${q}%`

  const [produtos, fornecedores, categorias] = await Promise.all([
    supabase
      .from('products')
      .select('id, nome, codigo, status, quantidade_atual, unidade_medida')
      .eq('status', 'ativo')
      .or(`nome.ilike.${pattern},codigo.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('fornecedores')
      .select('id, nome, cnpj')
      .eq('ativo', true)
      .ilike('nome', pattern)
      .limit(4),
    supabase
      .from('categories')
      .select('id, nome')
      .eq('ativo', true)
      .ilike('nome', pattern)
      .limit(3),
  ])

  return NextResponse.json({
    produtos: produtos.data ?? [],
    fornecedores: fornecedores.data ?? [],
    categorias: categorias.data ?? [],
  })
})
