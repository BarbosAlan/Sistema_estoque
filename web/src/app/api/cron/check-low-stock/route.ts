import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: products, error } = await supabase
    .from('products')
    .select('id, quantidade_atual, quantidade_minima')
    .eq('status', 'ativo')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let criados = 0
  let resolvidos = 0

  for (const product of products ?? []) {
    const { quantidade_atual, quantidade_minima } = product

    let tipoAlerta: string | null = null
    if (quantidade_atual === 0) {
      tipoAlerta = 'zerado'
    } else if (quantidade_minima > 0 && quantidade_atual <= quantidade_minima) {
      tipoAlerta = 'estoque_baixo'
    }

    if (tipoAlerta) {
      // Cria alerta só se ainda não existir um aberto do mesmo tipo
      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('produto_id', product.id)
        .eq('tipo_alerta', tipoAlerta)
        .eq('resolvido', false)
        .maybeSingle()

      if (!existing) {
        await supabase.from('alerts').insert({
          produto_id: product.id,
          tipo_alerta: tipoAlerta,
        })
        criados++
      }

      // Resolve alertas de outros tipos para o mesmo produto
      const outrosTipos = ['zerado', 'estoque_baixo'].filter(t => t !== tipoAlerta)
      await supabase
        .from('alerts')
        .update({ resolvido: true })
        .eq('produto_id', product.id)
        .in('tipo_alerta', outrosTipos)
        .eq('resolvido', false)
    } else {
      // Estoque OK — resolve todos os alertas abertos do produto
      const { count } = await supabase
        .from('alerts')
        .update({ resolvido: true })
        .eq('produto_id', product.id)
        .eq('resolvido', false)
        .select('*', { count: 'exact', head: true })

      resolvidos += count ?? 0
    }
  }

  return NextResponse.json({
    ok: true,
    produtos_verificados: (products ?? []).length,
    alertas_criados: criados,
    alertas_resolvidos: resolvidos,
  })
}
