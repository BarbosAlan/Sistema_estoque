import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SidebarContent } from '../Sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, onClick }: {
    children: React.ReactNode
    href: string
    className?: string
    onClick?: () => void
  }) => <a href={href} className={className} onClick={onClick}>{children}</a>,
}))

describe('SidebarContent', () => {
  it('mostra Usuários apenas para admin', () => {
    render(<SidebarContent perfil="admin" />)
    expect(screen.getByText('Usuários')).toBeTruthy()
  })

  it('esconde Usuários para estoquista', () => {
    render(<SidebarContent perfil="estoquista" />)
    expect(screen.queryByText('Usuários')).toBeNull()
  })

  it('esconde Usuários para funcionário', () => {
    render(<SidebarContent perfil="funcionario" />)
    expect(screen.queryByText('Usuários')).toBeNull()
  })

  it('esconde Alertas para funcionário', () => {
    render(<SidebarContent perfil="funcionario" />)
    expect(screen.queryByText('Alertas')).toBeNull()
  })

  it('mostra Alertas para estoquista', () => {
    render(<SidebarContent perfil="estoquista" />)
    expect(screen.getByText('Alertas')).toBeTruthy()
  })

  it('mostra Dashboard para todos os perfis', () => {
    const perfis = ['admin', 'estoquista', 'funcionario'] as const
    for (const perfil of perfis) {
      const { unmount } = render(<SidebarContent perfil={perfil} />)
      expect(screen.getByText('Dashboard')).toBeTruthy()
      unmount()
    }
  })

  it('marca o link ativo quando pathname corresponde', () => {
    render(<SidebarContent perfil="admin" />)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink.className).toContain('bg-primary')
  })
})
