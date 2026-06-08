import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  cnpj: z.string().max(18).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  telefone: z.string().max(20).optional().nullable(),
  observacao: z.string().max(1000).optional().nullable(),
})

export const PATCH = withAuth(['admin', 'estoquista'], async (req, _user, { params }) => {
  const id = (await params).id as string
  const body = updateSchema.parse(await req.json())
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('fornecedores')
    .update({
      nome: body.nome,
      cnpj: body.cnpj ?? undefined,
      email: body.email || null,
      telefone: body.telefone ?? undefined,
      observacao: body.observacao ?? undefined,
    })
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
    .from('fornecedores')
    .update({ ativo: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: null })
})
