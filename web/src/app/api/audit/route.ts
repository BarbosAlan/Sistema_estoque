import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'

export const GET = withAuth(['admin'], async (req) => {
  const { searchParams } = new URL(req.url)
  const acao = searchParams.get('acao') ?? ''
  const from_date = searchParams.get('from_date') ?? ''
  const to_date = searchParams.get('to_date') ?? ''
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 25
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabase = await createServiceClient()

  let query = supabase
    .from('audit_logs')
    .select(`
      id, acao, entidade_id, entidade_nome, campo, valor_anterior, valor_novo, criado_em,
      profile:profiles!audit_logs_usuario_id_fkey(id, nome, username)
    `, { count: 'exact' })
    .order('criado_em', { ascending: false })

  if (acao) query = query.eq('acao', acao)
  if (from_date) query = query.gte('criado_em', from_date)
  if (to_date) query = query.lte('criado_em', to_date + 'T23:59:59Z')
  if (search) query = query.ilike('entidade_nome', `%${search}%`)

  const { data, count, error } = await query.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count ?? 0 })
})
