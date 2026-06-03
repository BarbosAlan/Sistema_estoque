'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Search } from 'lucide-react'
import { createMovementSchema, type CreateMovementInput } from '@estoque/shared'
import { useCreateMovement } from '@/hooks/useMovements'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Props {
  open: boolean
  onClose: () => void
  defaultTipo?: 'entrada' | 'saida'
  defaultProdutoId?: string
}

const TIPOS = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
  { value: 'ajuste_entrada', label: 'Ajuste de Entrada' },
  { value: 'ajuste_saida', label: 'Ajuste de Saída' },
]

export function MovimentacaoFormModal({ open, onClose, defaultTipo, defaultProdutoId }: Props) {
  const createMovement = useCreateMovement()
  const [productSearch, setProductSearch] = useState('')
  const { data: products = [] } = useProducts({ search: productSearch, status: 'ativo' })

  const form = useForm<CreateMovementInput>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: {
      produto_id: defaultProdutoId ?? '',
      tipo: defaultTipo ?? 'entrada',
      quantidade: 1,
      motivo: '',
      observacao: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        produto_id: defaultProdutoId ?? '',
        tipo: defaultTipo ?? 'entrada',
        quantidade: 1,
        motivo: '',
        observacao: '',
      })
      setProductSearch('')
    }
  }, [open, defaultTipo, defaultProdutoId, form])

  const selectedProdutoId = form.watch('produto_id')
  const selectedProduct = products.find(p => p.id === selectedProdutoId)
    ?? (defaultProdutoId ? { id: defaultProdutoId, nome: '', codigo: '', unidade_medida: '' } : null)

  async function onSubmit(data: CreateMovementInput) {
    try {
      await createMovement.mutateAsync(data)
      onClose()
    } catch (err) {
      form.setError('root', { message: err instanceof Error ? err.message : 'Erro inesperado' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar movimentação</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="tipo" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="produto_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Produto</FormLabel>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produto..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-mono text-xs text-muted-foreground mr-2">{p.codigo}</span>
                          {p.nome}
                          <span className="text-xs text-muted-foreground ml-1">
                            (em estoque: {p.quantidade_atual} {p.unidade_medida})
                          </span>
                        </SelectItem>
                      ))}
                      {products.length === 0 && (
                        <SelectItem value="_empty" disabled>Nenhum produto encontrado</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="quantidade" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quantidade
                    {selectedProduct && (
                      <span className="font-normal text-muted-foreground ml-1">
                        ({selectedProduct.unidade_medida || 'un'})
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="motivo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="observacao" render={({ field }) => (
              <FormItem>
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea placeholder="Opcional" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
