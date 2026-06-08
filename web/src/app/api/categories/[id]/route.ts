import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().max(500).optional().nullable(),
  ativo: z.boolean().optional(),
})

export const PATCH = withAuth(['admin', 'estoquista'], async (req, _user, { params }) => {
  const id = (await params).id as string
  const body = updateSchema.parse(await req.json())
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('categories')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
})

export const DELETE = withAuth(['admin'], async (_req, _user, { params }) => {
  const id = (await params).id as string
  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('categories')
    .update({ ativo: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: null })
})
