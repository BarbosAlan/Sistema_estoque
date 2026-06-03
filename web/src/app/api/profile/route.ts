import { withAuth } from '@/lib/auth-middleware'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
})

export const PATCH = withAuth(['admin', 'estoquista', 'funcionario'], async (req, user) => {
  const body = updateProfileSchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ nome: body.data.nome })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
