'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createProductSchema, type CreateProductInput } from '@estoque/shared'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useFornecedores } from '@/hooks/useFornecedores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ProductWithCategory } from '@/services/productsService'

interface Props {
  open: boolean
  onClose: () => void
  product: ProductWithCategory | null
}

export function ProdutoFormModal({ open, onClose, product }: Props) {
  const { data: categories = [] } = useCategories()
  const { data: fornecedores = [] } = useFornecedores()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const isEditing = !!product

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      codigo: '', nome: '', categoria_id: '', fornecedor_id: null,
      unidade_medida: 'un', quantidade_minima: 0, valor_unitario: 0,
      descricao: '', localizacao: '',
    },
  })

  useEffect(() => {
    if (product) {
      form.reset({
        codigo: product.codigo,
        nome: product.nome,
        categoria_id: product.categoria_id,
        unidade_medida: product.unidade_medida,
        quantidade_minima: product.quantidade_minima,
        valor_unitario: product.valor_unitario ?? 0,
        fornecedor_id: product.fornecedor_id ?? null,
        descricao: product.descricao ?? '',
        localizacao: product.localizacao ?? '',
      })
    } else {
      form.reset({ codigo: '', nome: '', categoria_id: '', fornecedor_id: null, unidade_medida: 'un', quantidade_minima: 0, valor_unitario: 0 })
    }
  }, [product, form])

  async function onSubmit(data: CreateProductInput) {
    try {
      if (isEditing) {
        await updateProduct.mutateAsync({ id: product.id, input: data })
      } else {
        await createProduct.mutateAsync(data)
      }
      onClose()
    } catch (err) {
      form.setError('root', { message: err instanceof Error ? err.message : 'Erro inesperado' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar produto' : 'Novo produto'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="codigo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl><Input placeholder="EX-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unidade_medida" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <FormControl><Input placeholder="un, cx, kg..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Nome do produto" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="categoria_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="fornecedor_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                <Select value={field.value ?? ''} onValueChange={v => field.onChange(v || null)}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione um fornecedor..." /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {fornecedores.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="quantidade_minima" render={({ field }) => (
                <FormItem>
                  <FormLabel>Qtd. mínima</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} onChange={e => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="valor_unitario" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor unitário (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="localizacao" render={({ field }) => (
              <FormItem>
                <FormLabel>Localização</FormLabel>
                <FormControl><Input placeholder="Prateleira A1..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="descricao" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
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
                {isEditing ? 'Salvar' : 'Criar produto'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
