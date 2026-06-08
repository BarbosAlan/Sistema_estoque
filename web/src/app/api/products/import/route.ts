import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const rowSchema = z.object({
  nome: z.string().min(1),
  codigo: z.string().optional().nullable(),
  unidade_medida: z.string().optional().default('un'),
  quantidade_atual: z.number().int().min(0).optional().default(0),
  quantidade_minima: z.number().int().min(0).optional().default(0),
  valor_unitario: z.number().min(0).optional().default(0),
  localizacao: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  fornecedor: z.string().optional().nullable(),
})

const importSchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
})

export const POST = withAuth(['estoquista', 'admin'], async (req) => {
  const { rows } = importSchema.parse(await req.json())
  const supabase = await createServiceClient()

  const [{ data: cats }, { data: fors }] = await Promise.all([
    supabase.from('categories').select('id, nome').eq('ativo', true),
    supabase.from('fornecedores').select('id, nome').eq('ativo', true),
  ])

  const catMap = new Map((cats ?? []).map(c => [c.nome.toLowerCase().trim(), c.id]))
  const forMap = new Map((fors ?? []).map(f => [f.nome.toLowerCase().trim(), f.id]))

  let created = 0
  let updated = 0
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const categoria_id = row.categoria ? (catMap.get(row.categoria.toLowerCase().trim()) ?? null) : null
    const fornecedor_id = row.fornecedor ? (forMap.get(row.fornecedor.toLowerCase().trim()) ?? null) : null

    const product = {
      nome: row.nome,
      codigo: row.codigo || null,
      unidade_medida: row.unidade_medida || 'un',
      quantidade_atual: row.quantidade_atual ?? 0,
      quantidade_minima: row.quantidade_minima ?? 0,
      valor_unitario: row.valor_unitario ?? 0,
      localizacao: row.localizacao || null,
      descricao: row.descricao || null,
      categoria_id,
      fornecedor_id,
      status: 'ativo',
    }

    if (product.codigo) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('codigo', product.codigo)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase.from('products').update(product).eq('id', existing.id)
        if (error) errors.push({ row: i + 1, message: error.message })
        else updated++
        continue
      }
    }

    const { error } = await supabase.from('products').insert(product)
    if (error) errors.push({ row: i + 1, message: error.message })
    else created++
  }

  return NextResponse.json({ created, updated, errors })
})
