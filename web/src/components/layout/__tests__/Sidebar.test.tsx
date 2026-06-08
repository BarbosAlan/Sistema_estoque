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

const defaultProps = { nome: 'Alan Barbosa', email: 'alan@empresa.com' }

describe('SidebarContent', () => {
  it('mostra Configurações apenas para admin', () => {
    render(<SidebarContent perfil="admin" {...defaultProps} />)
    expect(screen.getByText('Configurações')).toBeTruthy()
  })

  it('esconde Configurações para estoquista', () => {
    render(<SidebarContent perfil="estoquista" {...defaultProps} />)
    expect(screen.queryByText('Configurações')).toBeNull()
  })

  it('esconde Configurações para funcionário', () => {
    render(<SidebarContent perfil="funcionario" {...defaultProps} />)
    expect(screen.queryByText('Configurações')).toBeNull()
  })

  it('esconde Alertas para funcionário', () => {
    render(<SidebarContent perfil="funcionario" {...defaultProps} />)
    expect(screen.queryByText('Alertas')).toBeNull()
  })

  it('mostra Alertas para estoquista', () => {
    render(<SidebarContent perfil="estoquista" {...defaultProps} />)
    expect(screen.getByText('Alertas')).toBeTruthy()
  })

  it('mostra Dashboard para todos os perfis', () => {
    const perfis = ['admin', 'estoquista', 'funcionario'] as const
    for (const perfil of perfis) {
      const { unmount } = render(<SidebarContent perfil={perfil} {...defaultProps} />)
      expect(screen.getByText('Dashboard')).toBeTruthy()
      unmount()
    }
  })

  it('marca o link ativo quando pathname corresponde', () => {
    render(<SidebarContent perfil="admin" {...defaultProps} />)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink.className).toContain('bg-primary')
  })

  it('mostra nome e email do usuário no rodapé', () => {
    render(<SidebarContent perfil="admin" nome="Alan Barbosa" email="alan@empresa.com" />)
    expect(screen.getByText('Alan Barbosa')).toBeTruthy()
    expect(screen.getByText('alan@empresa.com')).toBeTruthy()
  })
})
