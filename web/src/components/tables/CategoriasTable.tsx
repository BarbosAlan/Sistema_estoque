'use client'

import { useState } from 'react'
import { Tag, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { SortHeader } from '@/components/ui/sort-header'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { useCategories, useInactivateCategory } from '@/hooks/useCategories'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CategoriaFormModal } from '@/components/forms/CategoriaForm'
import type { Category } from '@/services/categoriesService'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(iso))
}

export function CategoriasTable() {
  const [search, setSearch] = useState('')
  const [orderBy, setOrderBy] = useState<'nome' | 'criado_em'>('nome')
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: categorias = [], isLoading } = useCategories()
  const inactivate = useInactivateCategory()
  const { isAdmin } = useAuth()

  const filtered = categorias
    .filter(c =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.descricao ?? '').toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const va = a[orderBy] ?? ''
      const vb = b[orderBy] ?? ''
      return orderDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  function handleSort(col: string) {
    if (orderBy === col) setOrderDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setOrderBy(col as typeof orderBy); setOrderDir('asc') }
  }

  const confirmTarget = categorias.find(c => c.id === confirmId)

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(c: Category) { setEditing(c); setModalOpen(true) }

  async function handleConfirmDelete() {
    if (!confirmId) return
    await inactivate.mutateAsync(confirmId)
    setConfirmId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nova categoria</span>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar categoria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Categoria" col="nome" current={orderBy} dir={orderDir} onSort={handleSort} />
              <TableHead className="hidden sm:table-cell">Descrição</TableHead>
              <SortHeader label="Criada em" col="criado_em" current={orderBy} dir={orderDir} onSort={handleSort} className="hidden md:table-cell" />
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  {search ? 'Nenhuma categoria encontrada.' : 'Nenhuma categoria cadastrada.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{cat.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {cat.descricao || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {formatDate(cat.criado_em)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cat.ativo ? 'default' : 'secondary'}>
                      {cat.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && cat.ativo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setConfirmId(cat.id)}
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

      <CategoriaFormModal open={modalOpen} onClose={() => setModalOpen(false)} categoria={editing} />

      <ConfirmDialog
        open={!!confirmId}
        title="Remover categoria"
        description={`Deseja remover a categoria "${confirmTarget?.nome}"? Produtos vinculados não serão afetados.`}
        confirmLabel="Remover"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmId(null)}
        loading={inactivate.isPending}
      />
    </div>
  )
}
