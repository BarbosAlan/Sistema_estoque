'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Bell,
  BarChart2,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import type { Perfil } from '@estoque/shared'

const navItems = [
  { href: '/',               label: 'Dashboard',      icon: LayoutDashboard, perfis: ['admin', 'estoquista', 'funcionario'] },
  { href: '/produtos',       label: 'Produtos',        icon: Package,         perfis: ['admin', 'estoquista', 'funcionario'] },
  { href: '/movimentacoes',  label: 'Movimentações',   icon: ArrowLeftRight,  perfis: ['admin', 'estoquista', 'funcionario'] },
  { href: '/alertas',        label: 'Alertas',         icon: Bell,            perfis: ['admin', 'estoquista'] },
  { href: '/relatorios',     label: 'Relatórios',      icon: BarChart2,       perfis: ['admin', 'estoquista'] },
  { href: '/usuarios',       label: 'Usuários',        icon: Users,           perfis: ['admin'] },
] as const

interface SidebarProps {
  perfil: Perfil
}

export function Sidebar({ perfil }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(item =>
    (item.perfis as readonly string[]).includes(perfil),
  )

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen bg-card border-r">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4">
        <Image src="/logo.png" alt="Logo" width={36} height={36} className="shrink-0" />
        <span className="font-semibold text-sm leading-tight">
          Controle de<br />
          <span className="text-primary font-bold">Estoque</span>
        </span>
      </div>

      <Separator />

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
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
    </aside>
  )
}
