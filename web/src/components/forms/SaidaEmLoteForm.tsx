'use client'

import { useState } from 'react'
import { X, Search, PackageMinus } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProductWithCategory } from '@/services/productsService'

type ItemLote = {
  produto: ProductWithCategory
  quantidade: number
  motivo: string
}

interface Props {
  open: boolean
  onClose: () => void
}

export function SaidaEmLoteModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [items, setItems] = useState<ItemLote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: searchResults = [] } = useProducts({ search, status: 'ativo' }, 1)
  const addedIds = new Set(items.map(i => i.produto.id))
  const dropdown = searchResults.filter(p => !addedIds.has(p.id)).slice(0, 6)

  function addItem(produto: ProductWithCategory) {
    setItems(prev => [...prev, { produto, quantidade: 1, motivo: '' }])
    setSearch('')
    setShowDropdown(false)
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.produto.id !== id))
  }

  function updateQtd(id: string, quantidade: number) {
    setItems(prev => prev.map(i => i.produto.id === id ? { ...i, quantidade } : i))
  }

  function updateMotivo(id: string, motivo: string) {
    setItems(prev => prev.map(i => i.produto.id === id ? { ...i, motivo } : i))
  }

  async function handleSubmit() {
    if (items.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/movements/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            produto_id: i.produto.id,
            quantidade: i.quantidade,
            motivo: i.motivo || undefined,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao registrar saída')
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar saída')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setItems([])
    setSearch('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Saída em lote</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-4 flex-1 overflow-hidden">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto para adicionar..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              className="pl-9"
            />
            {showDropdown && search && dropdown.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md">
                {dropdown.map(p => (
                  <button
                    key={p.id}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                    onMouseDown={() => addItem(p)}
                  >
                    <div>
                      <span className="font-medium">{p.nome}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-xs">{p.codigo}</span>
                    </div>
                    <span className={`text-xs font-semibold ${p.quantidade_atual === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {p.quantidade_atual} {p.unidade_medida}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista */}
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-center text-muted-foreground">
              <div>
                <PackageMinus className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Busque e adicione produtos acima</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {items.map(item => (
                <div key={item.produto.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.produto.nome}</span>
                      <span className="text-xs text-muted-foreground font-mono hidden sm:inline">{item.produto.codigo}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Disponível:{' '}
                      <strong className={item.produto.quantidade_atual === 0 ? 'text-destructive' : ''}>
                        {item.produto.quantidade_atual}
                      </strong>{' '}
                      {item.produto.unidade_medida}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        min={1}
                        max={item.produto.quantidade_atual}
                        value={item.quantidade}
                        onChange={e => updateQtd(item.produto.id, Number(e.target.value))}
                        className="w-24 h-8 text-sm"
                      />
                      <Input
                        placeholder="Motivo (opcional)"
                        value={item.motivo}
                        onChange={e => updateMotivo(item.produto.id, e.target.value)}
                        className="flex-1 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeItem(item.produto.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <span className="text-sm text-muted-foreground mr-auto">
            {items.length} produto{items.length !== 1 ? 's' : ''}
          </span>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={items.length === 0 || loading}>
            {loading ? 'Registrando...' : `Registrar ${items.length} saída${items.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
