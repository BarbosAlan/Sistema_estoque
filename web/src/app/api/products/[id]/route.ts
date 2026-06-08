import { withAuth } from '@/lib/auth-middleware'
import { createClient } from '@/lib/supabase-server'
import { updateProductSchema } from '@estoque/shared'
import { NextResponse } from 'next/server'

export const PATCH = withAuth(['admin', 'estoquista'], async (req, _, { params }) => {
  const { id } = await params
  const body = updateProductSchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update(body.data)
    .eq('id', id)
    .select('*, category:categories(id, nome), fornecedor:fornecedores(id, nome)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
})

export const DELETE = withAuth(['admin'], async (_, __, { params }) => {
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ status: 'inativo' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: null }, { status: 200 })
})
