import { withAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const GET = withAuth(['admin', 'estoquista'], async () => {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.rpc('get_previsao_ruptura')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
})
