import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import {
  Settings,
  Users,
  Bell,
  Database,
  Tag,
  Truck,
  Shield,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (profile?.perfil !== 'admin') redirect('/')

  const [
    { count: totalProdutos },
    { count: totalCateg },
    { count: totalFornec },
    { count: totalMovs },
    { count: totalUsuarios },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('fornecedores').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('movements').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('ativo', true),
  ])

  const stats = [
    { label: 'Produtos ativos', value: totalProdutos ?? 0, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Categorias', value: totalCateg ?? 0, icon: Tag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Fornecedores', value: totalFornec ?? 0, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Movimentações', value: totalMovs ?? 0, icon: ArrowRight, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Usuários', value: totalUsuarios ?? 0, icon: Users, color: 'text-primary', bg: 'bg-red-50' },
  ]

  const links = [
    { href: '/usuarios', label: 'Gerenciar usuários', desc: 'Criar, editar e desativar contas', icon: Users },
    { href: '/categorias', label: 'Gerenciar categorias', desc: 'Organizar categorias de produtos', icon: Tag },
    { href: '/fornecedores', label: 'Gerenciar fornecedores', desc: 'Cadastro de fornecedores', icon: Truck },
    { href: '/alertas', label: 'Central de alertas', desc: 'Alertas de estoque baixo e zerado', icon: Bell },
    { href: '/perfil', label: 'Meu perfil', desc: 'Editar dados e senha da conta', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral e atalhos de administração do sistema.</p>
      </div>

      {/* Estatísticas do sistema */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo do sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl border text-center">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold">{value.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links de administração */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Administração</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {links.map(({ href, label, desc, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
