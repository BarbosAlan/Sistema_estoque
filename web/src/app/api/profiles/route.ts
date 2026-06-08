import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const GET = withAuth(['admin', 'estoquista', 'funcionario'], async () => {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, username')
    .eq('ativo', true)
    .order('nome')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
})
