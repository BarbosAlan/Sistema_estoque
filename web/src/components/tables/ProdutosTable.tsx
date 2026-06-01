'use client'

import { useState } from 'react'
import { Pencil, PackageX, Search, Plus } from 'lucide-react'
import { useProducts, useInactivateProduct } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
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
import { ProdutoFormModal } from '@/components/forms/ProdutoForm'
import type { ProductWithCategory } from '@/services/productsService'

export function ProdutosTable() {
  const { isEstoquista } = useAuth()
  const [search, setSearch] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'todos'>('ativo')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null)

  const { data: products = [], isLoading } = useProducts({ search, categoria_id: categoriaId, status })
  const { data: categories = [] } = useCategories()
  const inactivate = useInactivateProduct()

  function handleEdit(product: ProductWithCategory) {
    setEditingProduct(product)
    setModalOpen(true)
  }

  function handleNew() {
    setEditingProduct(null)
    setModalOpen(true)
  }

  async function handleInactivate(id: string) {
    if (!confirm('Deseja inativar este produto?')) return
    await inactivate.mutateAsync(id)
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        {isEstoquista && (
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoriaId || 'todas'} onValueChange={(v) => setCategoriaId(!v || v === 'todas' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Un.</TableHead>
              <TableHead className="text-right">Qtd. atual</TableHead>
              <TableHead className="text-right">Qtd. mínima</TableHead>
              <TableHead>Status</TableHead>
              {isEstoquista && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.codigo}</TableCell>
                  <TableCell className="font-medium">{product.nome}</TableCell>
                  <TableCell>{product.category?.nome ?? '—'}</TableCell>
                  <TableCell>{product.unidade_medida}</TableCell>
                  <TableCell className={`text-right font-semibold ${product.quantidade_atual <= product.quantidade_minima ? 'text-destructive' : ''}`}>
                    {product.quantidade_atual}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{product.quantidade_minima}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'ativo' ? 'default' : 'secondary'}>
                      {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  {isEstoquista && (
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {product.status === 'ativo' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleInactivate(product.id)}
                          >
                            <PackageX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProdutoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
      />
    </div>
  )
}
