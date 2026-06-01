import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  username: z
    .string()
    .min(3, 'Usuário deve ter ao menos 3 caracteres')
    .max(30)
    .regex(/^[a-z0-9._-]+$/, 'Apenas letras minúsculas, números, ponto, hífen e underscore'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  perfil: z.enum(['admin', 'estoquista', 'funcionario']),
})

export const GET = withAuth(['admin'], async () => {
  const supabase = await createServiceClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, nome, username, perfil, ativo, criado_em')
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
  const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? '']))

  const data = profiles.map(p => ({ ...p, email: emailMap.get(p.id) ?? '' }))

  return NextResponse.json({ data })
})

export const POST = withAuth(['admin'], async (req) => {
  const body = createUserSchema.safeParse(await req.json())

  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 422 })
  }

  const { nome, username, email, password, perfil } = body.data
  const supabase = await createServiceClient()

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { perfil, nome, username },
  })

  if (authError) {
    const msg = authError.message.includes('already registered')
      ? 'E-mail já cadastrado.'
      : authError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authUser.user.id,
    nome,
    username,
    perfil,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id)
    const msg = profileError.message.includes('unique')
      ? 'Nome de usuário já em uso.'
      : profileError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ data: { id: authUser.user.id, nome, username, email, perfil } }, { status: 201 })
})
