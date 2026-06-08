'use client'

import { useState } from 'react'
import { Search, ShieldAlert, ClipboardList } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { Pagination } from '@/components/ui/pagination'

interface AuditLog {
  id: string
  acao: string
  entidade_id: string | null
  entidade_nome: string | null
  campo: string | null
  valor_anterior: string | null
  valor_novo: string | null
  criado_em: string
  profile: { id: string; nome: string; username: string } | null
}

const ACAO_LABEL: Record<string, string> = {
  'produto.criado': 'Produto criado',
  'produto.atualizado': 'Produto atualizado',
  'produto.inativado': 'Produto inativado',
  'produto.reativado': 'Produto reativado',
  'produto.preco_alterado': 'Preço alterado',
  'produto.minimo_alterado': 'Mínimo alterado',
}

const ACAO_VARIANT: Record<string, string> = {
  'produto.criado': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  'produto.atualizado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'produto.inativado': 'bg-red-100 text-destructive dark:bg-red-950/40',
  'produto.reativado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  'produto.preco_alterado': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'produto.minimo_alterado': 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
}

const CAMPO_LABEL: Record<string, string> = {
  status: 'Status',
  valor_unitario: 'Preço unit.',
  quantidade_minima: 'Qtd. mínima',
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function formatValor(campo: string | null, valor: string | null) {
  if (!valor || !campo) return '—'
  if (campo === 'valor_unitario') {
    const n = parseFloat(valor)
    return isNaN(n) ? valor : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }
  if (campo === 'status') return valor === 'ativo' ? 'Ativo' : 'Inativo'
  return valor
}

export default function AuditoriaPage() {
  const [acao, setAcao] = useState('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (acao) params.set('acao', acao)
  if (search) params.set('search', search)
  if (fromDate) params.set('from_date', fromDate)
  if (toDate) params.set('to_date', toDate)
  params.set('page', String(page))

  const { data, isLoading } = useQuery({
    queryKey: ['audit', acao, search, fromDate, toDate, page],
    queryFn: async () => {
      const res = await fetch(`/api/audit?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro')
      return { logs: json.data as AuditLog[], total: json.total as number }
    },
  })

  const logs = data?.logs ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-none">Auditoria</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Histórico de alterações em produtos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={acao || 'todos'} onValueChange={v => { setAcao(!v || v === 'todos' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Todas as ações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as ações</SelectItem>
            {Object.entries(ACAO_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-3">
          <Input
            type="date"
            value={fromDate}
            onChange={e => { setFromDate(e.target.value ?? ''); setPage(1) }}
            className="flex-1 sm:w-40"
            title="Data inicial"
          />
          <Input
            type="date"
            value={toDate}
            onChange={e => { setToDate(e.target.value); setPage(1) }}
            className="flex-1 sm:w-40"
            title="Data final"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data / hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="hidden md:table-cell">Campo</TableHead>
              <TableHead className="hidden md:table-cell">Antes</TableHead>
              <TableHead className="hidden md:table-cell">Depois</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={8} cols={7} />
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhum registro encontrado.</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.criado_em)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.profile?.nome || log.profile?.username || '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACAO_VARIANT[log.acao] ?? 'bg-muted text-muted-foreground'}`}>
                      {ACAO_LABEL[log.acao] ?? log.acao}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-sm max-w-[160px] truncate">
                    {log.entidade_nome ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {log.campo ? (CAMPO_LABEL[log.campo] ?? log.campo) : '—'}
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell">
                    {log.valor_anterior !== null
                      ? <span className="line-through text-muted-foreground">{formatValor(log.campo, log.valor_anterior)}</span>
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm font-medium hidden md:table-cell">
                    {log.valor_novo !== null ? formatValor(log.campo, log.valor_novo) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </div>
  )
}
