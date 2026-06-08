import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import type { Perfil } from '@estoque/shared'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, username, perfil')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        perfil={profile.perfil as Perfil}
        nome={profile.nome}
        email={user.email ?? profile.username}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          nome={profile.nome}
          perfil={profile.perfil as Perfil}
          email={user.email ?? profile.username}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  )
}
