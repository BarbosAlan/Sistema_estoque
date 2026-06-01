import type { Perfil, ProfileWithEmail } from '@estoque/shared'

export interface CreateUserInput {
  nome: string
  username: string
  email: string
  password: string
  perfil: Perfil
}

export interface UpdateUserInput {
  nome?: string
  username?: string
  perfil?: Perfil
  ativo?: boolean
}

export async function listUsers(): Promise<ProfileWithEmail[]> {
  const res = await fetch('/api/users')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao listar usuários')
  return json.data
}

export async function createUser(input: CreateUserInput): Promise<void> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Erro ao criar usuário')
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<void> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Erro ao atualizar usuário')
}

export async function deactivateUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Erro ao desativar usuário')
}
