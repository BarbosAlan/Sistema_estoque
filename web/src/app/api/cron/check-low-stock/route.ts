import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { determinarTipoAlerta } from '@/utils/alertas'

export const runtime = 'nodejs'
export const maxDuration = 60

interface NovoAlerta {
  nome: string
  tipo: string
}

async function sendPushNotifications(
  supabase: ReturnType<typeof createClient>,
  novosAlertas: NovoAlerta[],
) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('push_tokens(token)')
    .in('perfil', ['admin', 'estoquista'])
    .eq('ativo', true)

  const tokens = (profiles ?? []).flatMap(
    p => (p.push_tokens as Array<{ token: string }>).map(pt => pt.token),
  )
  if (!tokens.length) return

  const messages = tokens.flatMap(to =>
    novosAlertas.map(a => ({
      to,
      title: a.tipo === 'zerado' ? 'Produto zerado' : 'Estoque baixo',
      body: a.nome,
      sound: 'default',
    })),
  )

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  })
}

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
    .select('id, nome, quantidade_atual, quantidade_minima')
    .eq('status', 'ativo')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let criados = 0
  let resolvidos = 0
  const novosAlertas: NovoAlerta[] = []

  for (const product of products ?? []) {
    const { quantidade_atual, quantidade_minima } = product

    const tipoAlerta = determinarTipoAlerta(quantidade_atual, quantidade_minima)

    if (tipoAlerta) {
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
        novosAlertas.push({ nome: product.nome, tipo: tipoAlerta })
        criados++
      }

      const outrosTipos = ['zerado', 'estoque_baixo'].filter(t => t !== tipoAlerta)
      await supabase
        .from('alerts')
        .update({ resolvido: true })
        .eq('produto_id', product.id)
        .in('tipo_alerta', outrosTipos)
        .eq('resolvido', false)
    } else {
      await supabase
        .from('alerts')
        .update({ resolvido: true })
        .eq('produto_id', product.id)
        .eq('resolvido', false)

      resolvidos++
    }
  }

  if (novosAlertas.length > 0) {
    await sendPushNotifications(supabase, novosAlertas).catch(console.error)
  }

  return NextResponse.json({
    ok: true,
    produtos_verificados: (products ?? []).length,
    alertas_criados: criados,
    alertas_resolvidos: resolvidos,
  })
}
