'use client'

import { useState, useEffect } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Search } from 'lucide-react'
import { useMovements } from '@/hooks/useMovements'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MovimentacaoFormModal } from '@/components/forms/MovimentacaoForm'
import { Pagination } from '@/components/ui/pagination'
import type { MovementType } from '@estoque/shared'

const TIPO_LABELS: Record<MovementType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste_entrada: 'Ajuste +',
  ajuste_saida: 'Ajuste -',
}

const TIPO_VARIANTS: Record<MovementType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  entrada: 'default',
  saida: 'destructive',
  ajuste_entrada: 'secondary',
  ajuste_saida: 'outline',
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function MovimentacoesTable() {
  const [tipo, setTipo] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultTipo, setDefaultTipo] = useState<'entrada' | 'saida'>('entrada')

  const { data: movements = [], total, isLoading } = useMovements(
    { tipo, from_date: fromDate, to_date: toDate, search },
    page,
  )

  useEffect(() => { setPage(1) }, [tipo, fromDate, toDate, search])

  function openModal(t: 'entrada' | 'saida') {
    setDefaultTipo(t)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Movimentações</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openModal('saida')}>
            <ArrowUpCircle className="h-4 w-4 text-destructive sm:mr-2" />
            <span className="hidden sm:inline">Saída</span>
          </Button>
          <Button size="sm" onClick={() => openModal('entrada')}>
            <ArrowDownCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Entrada</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipo || 'todos'} onValueChange={v => setTipo(!v || v === 'todos' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
            <SelectItem value="ajuste_entrada">Ajuste +</SelectItem>
            <SelectItem value="ajuste_saida">Ajuste -</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-3">
          <Input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="flex-1 sm:w-40"
            title="Data inicial"
          />
          <Input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="flex-1 sm:w-40"
            title="Data final"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead className="hidden sm:table-cell">Usuário</TableHead>
              <TableHead className="hidden md:table-cell">Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhuma movimentação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              movements.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDateTime(m.criado_em)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{m.product?.nome ?? '—'}</span>
                      {m.product?.codigo && (
                        <span className="block text-xs font-mono text-muted-foreground">
                          {m.product.codigo}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TIPO_VARIANTS[m.tipo]}>
                      {TIPO_LABELS[m.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {['saida', 'ajuste_saida'].includes(m.tipo) ? '-' : '+'}
                    {m.quantidade}
                    {m.product?.unidade_medida && (
                      <span className="text-xs text-muted-foreground ml-1">{m.product.unidade_medida}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm hidden sm:table-cell">{m.profile?.nome ?? m.profile?.username ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{m.motivo ?? '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      <MovimentacaoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTipo={defaultTipo}
      />
    </div>
  )
}
