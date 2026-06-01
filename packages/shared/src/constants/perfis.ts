import type { Perfil } from '../types/user.types'

export const PERFIS: Record<Perfil, string> = {
  admin: 'Administrador',
  estoquista: 'Estoquista',
  funcionario: 'Funcionário',
}

export const PERFIS_COM_ACESSO_TOTAL: Perfil[] = ['admin', 'estoquista']
