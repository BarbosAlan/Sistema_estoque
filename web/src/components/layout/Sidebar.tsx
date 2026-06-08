'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Tag,
  PackagePlus,
  PackageMinus,
  Repeat2,
  Truck,
  BarChart2,
  Bell,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import type { Perfil } from '@estoque/shared'

const navItems = [
  { href: '/',               label: 'Dashboard',      icon: LayoutDashboard, perfis: ['admin', 'estoquista', 'funcionario'] },
  { href: '/produtos',       label: 'Produtos',        icon: Package,         perfis: ['admin', 'estoquista', 'funcionario'] },
  { href: '/categorias',     label: 'Categorias',      icon: Tag,             perfis: ['admin', 'estoquista'] },
  { href: '/entradas',       label: 'Entradas',        icon: PackagePlus,     perfis: ['admin', 'estoquista', 'funcionario'] },
  { href: '/saidas',         label: 'Saídas',          icon: PackageMinus,    perfis: ['admin', 'estoquista', 'funcionario'] },
  { href: '/transferencias', label: 'Transferências',  icon: Repeat2,         perfis: ['admin', 'estoquista'] },
  { href: '/fornecedores',   label: 'Fornecedores',    icon: Truck,           perfis: ['admin', 'estoquista'] },
  { href: '/relatorios',     label: 'Relatórios',      icon: BarChart2,       perfis: ['admin', 'estoquista'] },
  { href: '/alertas',        label: 'Alertas',         icon: Bell,            perfis: ['admin', 'estoquista'] },
  { href: '/configuracoes',  label: 'Configurações',   icon: Settings,        perfis: ['admin'] },
] as const

interface SidebarContentProps {
  perfil: Perfil
  nome: string
  email: string
  onNavigate?: () => void
}

export function SidebarContent({ perfil, nome, email, onNavigate }: SidebarContentProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(item =>
    (item.perfis as readonly string[]).includes(perfil),
  )

  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <>
      <div className="flex items-center gap-3 px-5 py-4 shrink-0">
        <Image src="/logo.png" alt="Logo" width={36} height={36} className="shrink-0" />
        <span className="font-semibold text-sm leading-tight">
          Controle de<br />
          <span className="text-primary font-bold">Estoque</span>
        </span>
      </div>

      <Separator />

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="px-3 py-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary-foreground">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate">{nome}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{email}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </>
  )
}

interface SidebarProps {
  perfil: Perfil
  nome: string
  email: string
}

export function Sidebar({ perfil, nome, email }: SidebarProps) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col h-screen bg-card border-r">
      <SidebarContent perfil={perfil} nome={nome} email={email} />
    </aside>
  )
}
