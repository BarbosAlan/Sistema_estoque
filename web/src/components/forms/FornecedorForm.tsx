'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateFornecedor, useUpdateFornecedor } from '@/hooks/useFornecedores'
import type { Fornecedor } from '@/services/fornecedoresService'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(200),
  cnpj: z.string().max(18).optional(),
  email: z.union([z.string().email('E-mail inválido'), z.literal('')]).optional(),
  telefone: z.string().max(20).optional(),
  observacao: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  fornecedor?: Fornecedor | null
}

export function FornecedorFormModal({ open, onClose, fornecedor }: Props) {
  const isEditing = !!fornecedor
  const create = useCreateFornecedor()
  const update = useUpdateFornecedor()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset({
        nome: fornecedor?.nome ?? '',
        cnpj: fornecedor?.cnpj ?? '',
        email: fornecedor?.email ?? '',
        telefone: fornecedor?.telefone ?? '',
        observacao: fornecedor?.observacao ?? '',
      })
    }
  }, [open, fornecedor, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        nome: values.nome,
        cnpj: values.cnpj || null,
        email: values.email || null,
        telefone: values.telefone || null,
        observacao: values.observacao || null,
      }
      if (isEditing && fornecedor) {
        await update.mutateAsync({ id: fornecedor.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      onClose()
    } catch {}
  }

  const isPending = create.isPending || update.isPending
  const error = create.error?.message || update.error?.message

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register('nome')} placeholder="Nome do fornecedor" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" {...register('cnpj')} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" {...register('telefone')} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} placeholder="contato@fornecedor.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="observacao">Observação</Label>
              <Input id="observacao" {...register('observacao')} placeholder="Informações adicionais" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
