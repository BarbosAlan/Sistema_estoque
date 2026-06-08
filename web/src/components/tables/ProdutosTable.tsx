'use client'

import { useState, useEffect } from 'react'
import { Pencil, PackageX, PackageCheck, Search, Plus, Eye } from 'lucide-react'
import Link from 'next/link'
import { useProducts, useInactivateProduct, useUpdateProduct } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useFornecedores } from '@/hooks/useFornecedores'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ProdutoFormModal } from '@/components/forms/ProdutoForm'
import { Pagination } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { ProductWithCategory } from '@/services/productsService'

export function ProdutosTable() {
  const { isEstoquista } = useAuth()
  const [search, setSearch] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [fornecedorId, setFornecedorId] = useState('')
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'todos'>('ativo')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { data: products = [], total, isLoading } = useProducts(
    { search, categoria_id: categoriaId, fornecedor_id: fornecedorId, status },
    page,
  )

  useEffect(() => { setPage(1) }, [search, categoriaId, fornecedorId, status])
  const { data: categories = [] } = useCategories()
  const { data: fornecedores = [] } = useFornecedores()
  const inactivate = useInactivateProduct()
  const reactivate = useUpdateProduct()

  const confirmTarget = products.find(p => p.id === confirmId)

  function handleEdit(product: ProductWithCategory) {
    setEditingProduct(product)
    setModalOpen(true)
  }

  async function handleConfirmInactivate() {
    if (!confirmId) return
    await inactivate.mutateAsync(confirmId)
    setConfirmId(null)
  }

  async function handleReactivate(id: string) {
    await reactivate.mutateAsync({ id, input: { status: 'ativo' } })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Produtos</h1>
        {isEstoquista && (
          <Button onClick={() => { setEditingProduct(null); setModalOpen(true) }} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Novo produto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoriaId || 'todas'} onValueChange={v => setCategoriaId(!v || v === 'todas' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fornecedorId || 'todos'} onValueChange={v => setFornecedorId(!v || v === 'todos' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Fornecedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os fornecedores</SelectItem>
            {fornecedores.map(f => (
              <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              <TableHead className="hidden lg:table-cell">Fornecedor</TableHead>
              <TableHead className="hidden xl:table-cell">Localização</TableHead>
              <TableHead className="hidden md:table-cell">Un.</TableHead>
              <TableHead className="text-right">Qtd. atual</TableHead>
              <TableHead className="text-right hidden md:table-cell">Qtd. mínima</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="hidden md:table-cell font-mono text-sm">{product.codigo}</TableCell>
                  <TableCell className="font-medium">{product.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{product.category?.nome ?? '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {product.fornecedor?.nome ?? '—'}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                    {product.localizacao ?? '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.unidade_medida}</TableCell>
                  <TableCell className={`text-right font-semibold ${product.quantidade_atual <= product.quantidade_minima ? 'text-destructive' : ''}`}>
                    {product.quantidade_atual}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden md:table-cell">{product.quantidade_minima}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'ativo' ? 'default' : 'secondary'}>
                      {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Link
                        href={`/produtos/${product.id}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Link>
                      {isEstoquista && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {product.status === 'ativo' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setConfirmId(product.id)}
                            >
                              <PackageX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-emerald-600 hover:text-emerald-700"
                              onClick={() => handleReactivate(product.id)}
                              disabled={reactivate.isPending}
                            >
                              <PackageCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </>
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

      <ProdutoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
      />

      <ConfirmDialog
        open={!!confirmId}
        title="Inativar produto"
        description={`Deseja inativar "${confirmTarget?.nome}"? O histórico de movimentações será preservado.`}
        confirmLabel="Inativar"
        onConfirm={handleConfirmInactivate}
        onCancel={() => setConfirmId(null)}
        loading={inactivate.isPending}
      />
    </div>
  )
}
