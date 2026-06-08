'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { SidebarContent } from './Sidebar'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { Perfil } from '@estoque/shared'

interface MobileSidebarProps {
  perfil: Perfil
  nome: string
  email: string
}

export function MobileSidebar({ perfil, nome, email }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'lg:hidden')}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-card border-r shadow-xl lg:hidden">
            <button
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'absolute top-2 right-2')}
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </button>
            <SidebarContent perfil={perfil} nome={nome} email={email} onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}
