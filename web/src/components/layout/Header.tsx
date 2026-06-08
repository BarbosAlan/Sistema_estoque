'use client'

import { LogOut, UserCircle, Search, Bell } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PERFIS } from '@estoque/shared'
import type { Perfil } from '@estoque/shared'
import { MobileSidebar } from './MobileSidebar'

interface HeaderProps {
  nome: string
  perfil: Perfil
  email: string
}

export function Header({ nome, perfil, email }: HeaderProps) {
  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const firstName = nome.split(' ')[0]

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 gap-4 shrink-0">
      {/* Left: mobile menu + greeting */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileSidebar perfil={perfil} nome={nome} email={email} />
        <div className="hidden sm:block min-w-0">
          <p className="text-sm font-semibold leading-none">
            Olá, {firstName}! 👋
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Confira o resumo do seu estoque hoje.</p>
        </div>
      </div>

      {/* Right: search + bell + avatar */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search bar */}
        <div className="hidden md:flex items-center gap-2 bg-muted/60 border rounded-lg px-3 py-1.5 w-56">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar produtos, categorias..."
            className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-full"
          />
        </div>

        {/* Bell */}
        <Link href="/alertas" className="relative h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Link>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent transition-colors outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-none">{nome}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {PERFIS[perfil]}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuItem>
                <Link href="/perfil" className="flex items-center w-full cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Meu perfil
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-0">
              <form action="/api/auth/signout" method="POST" className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center px-1.5 py-1 text-sm text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
