'use client'

import { useState } from 'react'
import { Truck, Plus, Pencil, Trash2, Search, Mail, Phone } from 'lucide-react'
import { useFornecedores, useInactivateFornecedor } from '@/hooks/useFornecedores'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { FornecedorFormModal } from '@/components/forms/FornecedorForm'
import type { Fornecedor } from '@/services/fornecedoresService'

export function FornecedoresTable() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Fornecedor | null>(null)

  const { data: fornecedores, total, isLoading } = useFornecedores(search, page)
  const inactivate = useInactivateFornecedor()
  const { isAdmin, isEstoquista } = useAuth()

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(f: Fornecedor) { setEditing(f); setModalOpen(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        {(isAdmin || isEstoquista) && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo fornecedor</span>
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar fornecedor..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">Contato</TableHead>
              <TableHead className="hidden lg:table-cell">Observação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : fornecedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  {search ? 'Nenhum fornecedor encontrado.' : 'Nenhum fornecedor cadastrado.'}
                </TableCell>
              </TableRow>
            ) : (
              fornecedores.map(f => (
                <TableRow key={f.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{f.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {f.cnpj || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-0.5">
                      {f.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />{f.email}
                        </div>
                      )}
                      {f.telefone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />{f.telefone}
                        </div>
                      )}
                      {!f.email && !f.telefone && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell max-w-[200px]">
                    <span className="truncate block">{f.observacao || '—'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(isAdmin || isEstoquista) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => inactivate.mutate(f.id)}
                          disabled={inactivate.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      <FornecedorFormModal open={modalOpen} onClose={() => setModalOpen(false)} fornecedor={editing} />
    </div>
  )
}
