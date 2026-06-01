import { withAuth } from '@/lib/auth-middleware'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const GET = withAuth(['admin', 'estoquista', 'funcionario'], async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
})
