'use client'

import { useState } from 'react'
import { Pencil, UserX, UserCheck, Plus, Search } from 'lucide-react'
import { useUsers, useDeactivateUser, useUpdateUser } from '@/hooks/useUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { UsuarioFormModal } from '@/components/forms/UsuarioForm'
import type { ProfileWithEmail, Perfil } from '@estoque/shared'

const PERFIL_LABELS: Record<Perfil, string> = {
  admin: 'Administrador',
  estoquista: 'Estoquista',
  funcionario: 'Funcionário',
}

const PERFIL_VARIANTS: Record<Perfil, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  estoquista: 'secondary',
  funcionario: 'outline',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(iso))
}

export function UsuariosTable() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ProfileWithEmail | null>(null)

  const { data: users = [], isLoading } = useUsers()
  const deactivate = useDeactivateUser()
  const activate = useUpdateUser()

  const filtered = search
    ? users.filter(u =>
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  function handleEdit(user: ProfileWithEmail) {
    setEditingUser(user)
    setModalOpen(true)
  }

  function handleNew() {
    setEditingUser(null)
    setModalOpen(true)
  }

  async function handleDeactivate(user: ProfileWithEmail) {
    if (!confirm(`Deseja desativar o usuário "${user.nome}"?`)) return
    await deactivate.mutateAsync(user.id)
  }

  async function handleActivate(user: ProfileWithEmail) {
    await activate.mutateAsync({ id: user.id, input: { ativo: true } })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, usuário ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(user => (
                <TableRow key={user.id} className={!user.ativo ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    @{user.username}
                  </TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={PERFIL_VARIANTS[user.perfil]}>
                      {PERFIL_LABELS[user.perfil]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.ativo ? 'default' : 'secondary'}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.criado_em)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.ativo ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeactivate(user)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground"
                          onClick={() => handleActivate(user)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UsuarioFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editingUser}
      />
    </div>
  )
}
