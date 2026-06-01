export type Perfil = 'admin' | 'estoquista' | 'funcionario'

export interface Profile {
  id: string
  nome: string
  username: string
  perfil: Perfil
  ativo: boolean
  criado_em: string
}

export interface ProfileWithEmail extends Profile {
  email: string
}
