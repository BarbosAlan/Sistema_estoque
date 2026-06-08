'use client'

import { useState } from 'react'
import { Truck, Plus, Pencil, Trash2, Search, Mail, Phone } from 'lucide-react'
import { useFornecedores, useInactivateFornecedor } from '@/hooks/useFornecedores'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SortHeader } from '@/components/ui/sort-header'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { FornecedorFormModal } from '@/components/forms/FornecedorForm'
import type { Fornecedor } from '@/services/fornecedoresService'

export function FornecedoresTable() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [orderBy, setOrderBy] = useState('nome')
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Fornecedor | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function handleSort(col: string) {
    if (orderBy === col) setOrderDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setOrderBy(col); setOrderDir('asc') }
    setPage(1)
  }

  const { data: fornecedores, total, isLoading } = useFornecedores(search, page, orderBy, orderDir)
  const inactivate = useInactivateFornecedor()
  const { isAdmin, isEstoquista } = useAuth()

  const confirmTarget = fornecedores.find(f => f.id === confirmId)

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(f: Fornecedor) { setEditing(f); setModalOpen(true) }

  async function handleConfirmDelete() {
    if (!confirmId) return
    await inactivate.mutateAsync(confirmId)
    setConfirmId(null)
  }

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
              <SortHeader label="Fornecedor" col="nome" current={orderBy} dir={orderDir} onSort={handleSort} />
              <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">Contato</TableHead>
              <TableHead className="hidden lg:table-cell">Observação</TableHead>
              <SortHeader label="Cadastrado em" col="criado_em" current={orderBy} dir={orderDir} onSort={handleSort} className="hidden xl:table-cell" />
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={6} cols={5} />
            ) : fornecedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
                  <TableCell className="text-sm text-muted-foreground hidden xl:table-cell whitespace-nowrap">
                    {new Date(f.criado_em).toLocaleDateString('pt-BR')}
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
                          onClick={() => setConfirmId(f.id)}
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

      <ConfirmDialog
        open={!!confirmId}
        title="Remover fornecedor"
        description={`Deseja remover "${confirmTarget?.nome}"? Produtos vinculados a ele não serão afetados.`}
        confirmLabel="Remover"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmId(null)}
        loading={inactivate.isPending}
      />
    </div>
  )
}
