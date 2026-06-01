import { createClient } from '@/lib/supabase-server'
import type { Perfil } from '@estoque/shared'
import { NextResponse } from 'next/server'

type AuthUser = { id: string; perfil: Perfil }
type RouteContext = { params: Promise<Record<string, string>> }
type Handler = (req: Request, user: AuthUser, ctx: RouteContext) => Promise<Response>

export function withAuth(perfisPermitidos: Perfil[], handler: Handler) {
  return async (req: Request, ctx: RouteContext): Promise<Response> => {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const perfil = user.user_metadata?.perfil as Perfil | undefined

    if (!perfil || !perfisPermitidos.includes(perfil)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    return handler(req, { id: user.id, perfil }, ctx)
  }
}
