'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
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
import type { ProfileWithEmail, Perfil } from '@estoque/shared'

const createSchema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres'),
  username: z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/, 'Apenas letras minúsculas, números, ponto, hífen e underscore'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  perfil: z.enum(['admin', 'estoquista', 'funcionario']),
})

const editSchema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres'),
  username: z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/, 'Apenas letras minúsculas, números, ponto, hífen e underscore'),
  perfil: z.enum(['admin', 'estoquista', 'funcionario']),
})

type CreateInput = z.infer<typeof createSchema>

const PERFIS: { value: Perfil; label: string }[] = [
  { value: 'funcionario', label: 'Funcionário' },
  { value: 'estoquista', label: 'Estoquista' },
  { value: 'admin', label: 'Administrador' },
]

interface Props {
  open: boolean
  onClose: () => void
  user: ProfileWithEmail | null
}

export function UsuarioFormModal({ open, onClose, user }: Props) {
  const isEditing = !!user
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const form = useForm<CreateInput>({
    resolver: zodResolver(isEditing ? editSchema : createSchema) as any,
    defaultValues: { nome: '', username: '', email: '', password: '', perfil: 'funcionario' },
  })

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({ nome: user.nome, username: user.username, perfil: user.perfil } as CreateInput)
      } else {
        form.reset({ nome: '', username: '', email: '', password: '', perfil: 'funcionario' })
      }
    }
  }, [open, user, form])

  async function onSubmit(data: CreateInput) {
    try {
      if (isEditing) {
        await updateUser.mutateAsync({ id: user.id, input: { nome: data.nome, username: data.username, perfil: data.perfil } })
      } else {
        await createUser.mutateAsync(data)
      }
      onClose()
    } catch (err) {
      form.setError('root', { message: err instanceof Error ? err.message : 'Erro inesperado' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl><Input placeholder="João Silva" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de usuário</FormLabel>
                <FormControl><Input placeholder="joao.silva" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {!isEditing && (
              <>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl><Input type="email" placeholder="joao@empresa.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha inicial</FormLabel>
                    <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            <FormField control={form.control} name="perfil" render={({ field }) => (
              <FormItem>
                <FormLabel>Perfil de acesso</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PERFIS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {isEditing ? 'Salvar' : 'Criar usuário'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
