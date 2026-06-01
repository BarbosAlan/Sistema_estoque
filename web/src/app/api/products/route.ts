import { withAuth } from '@/lib/auth-middleware'
import { createClient } from '@/lib/supabase-server'
import { createProductSchema } from '@estoque/shared'
import { NextResponse } from 'next/server'

export const GET = withAuth(['admin', 'estoquista', 'funcionario'], async (req) => {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const categoria_id = searchParams.get('categoria_id') ?? ''
  const status = searchParams.get('status') ?? 'ativo'

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, category:categories(id, nome)')
    .order('nome')

  if (status !== 'todos') query = query.eq('status', status)
  if (categoria_id) query = query.eq('categoria_id', categoria_id)
  if (search) query = query.ilike('nome', `%${search}%`)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
})

export const POST = withAuth(['admin', 'estoquista'], async (req) => {
  const body = createProductSchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert(body.data)
    .select('*, category:categories(id, nome)')
    .single()

  if (error) {
    const msg = error.message.includes('unique') ? 'Código já cadastrado.' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  return NextResponse.json({ data }, { status: 201 })
})
