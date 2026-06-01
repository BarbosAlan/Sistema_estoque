import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateUserSchema = z.object({
  nome: z.string().min(2).optional(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/).optional(),
  perfil: z.enum(['admin', 'estoquista', 'funcionario']).optional(),
  ativo: z.boolean().optional(),
})

export const PATCH = withAuth(['admin'], async (req, _user, ctx) => {
  const { id } = await ctx.params
  const body = updateUserSchema.safeParse(await req.json())

  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = await createServiceClient()
  const updates = body.data

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (updates.perfil || updates.nome || updates.username) {
    const meta: Record<string, string> = {}
    if (updates.perfil) meta.perfil = updates.perfil
    if (updates.nome) meta.nome = updates.nome
    if (updates.username) meta.username = updates.username
    await supabase.auth.admin.updateUserById(id!, { user_metadata: meta })
  }

  return NextResponse.json({ data: { id } })
})

export const DELETE = withAuth(['admin'], async (_req, user, ctx) => {
  const { id } = await ctx.params

  if (id === user.id) {
    return NextResponse.json({ error: 'Você não pode desativar sua própria conta.' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('profiles')
    .update({ ativo: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { id } })
})
