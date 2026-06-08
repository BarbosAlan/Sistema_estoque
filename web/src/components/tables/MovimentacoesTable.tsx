'use client'

import { useState, useEffect } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Search, PackageMinus, FileText, FileSpreadsheet } from 'lucide-react'
import { useMovements } from '@/hooks/useMovements'
import { useProfiles } from '@/hooks/useProfiles'
import { listMovements } from '@/services/movementsService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SortHeader } from '@/components/ui/sort-header'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { MovimentacaoFormModal } from '@/components/forms/MovimentacaoForm'
import { SaidaEmLoteModal } from '@/components/forms/SaidaEmLoteForm'
import { Pagination } from '@/components/ui/pagination'
import type { MovementType } from '@estoque/shared'
import type { MovementWithRelations } from '@/services/movementsService'

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

const TITULOS: Record<string, string> = {
  entrada: 'Entradas',
  saida: 'Saídas',
  ajuste: 'Transferências e Ajustes',
  '': 'Movimentações',
}

function exportPDF(movements: MovementWithRelations[], titulo: string) {
  import('jspdf').then(async ({ jsPDF }) => {
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })
    const now = new Date().toLocaleString('pt-BR')
    doc.setFontSize(16)
    doc.text(titulo, 14, 16)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Gerado em: ${now}`, 14, 23)
    autoTable(doc, {
      startY: 28,
      head: [['Data', 'Produto', 'Código', 'Tipo', 'Quantidade', 'Usuário', 'Motivo']],
      body: movements.map(m => [
        formatDateTime(m.criado_em),
        m.product?.nome ?? '—',
        m.product?.codigo ?? '—',
        TIPO_LABELS[m.tipo],
        `${['saida', 'ajuste_saida'].includes(m.tipo) ? '-' : '+'}${m.quantidade} ${m.product?.unidade_medida ?? ''}`.trim(),
        m.profile?.nome ?? m.profile?.username ?? '—',
        m.motivo ?? '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 0, 0] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    })
    doc.save(`movimentacoes-${new Date().toISOString().slice(0, 10)}.pdf`)
  })
}

function exportExcel(movements: MovementWithRelations[], titulo: string) {
  import('xlsx').then(({ utils, writeFile }) => {
    const rows = movements.map(m => ({
      'Data': formatDateTime(m.criado_em),
      'Produto': m.product?.nome ?? '—',
      'Código': m.product?.codigo ?? '—',
      'Tipo': TIPO_LABELS[m.tipo],
      'Quantidade': (['saida', 'ajuste_saida'].includes(m.tipo) ? -1 : 1) * m.quantidade,
      'Unidade': m.product?.unidade_medida ?? '',
      'Usuário': m.profile?.nome ?? m.profile?.username ?? '—',
      'Motivo': m.motivo ?? '',
    }))
    const ws = utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 18 }, { wch: 32 }, { wch: 12 }, { wch: 14 },
      { wch: 10 }, { wch: 8 }, { wch: 22 }, { wch: 30 },
    ]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, titulo.slice(0, 31))
    writeFile(wb, `movimentacoes-${new Date().toISOString().slice(0, 10)}.xlsx`)
  })
}

interface MovimentacoesTableProps {
  tipoFixo?: 'entrada' | 'saida' | 'ajuste'
}

export function MovimentacoesTable({ tipoFixo }: MovimentacoesTableProps = {}) {
  const [tipo, setTipo] = useState(tipoFixo ?? '')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultTipo, setDefaultTipo] = useState<'entrada' | 'saida'>('entrada')
  const [loteOpen, setLoteOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { data: profiles = [] } = useProfiles()
  const { data: movements = [], total, isLoading } = useMovements(
    { tipo, from_date: fromDate, to_date: toDate, search, usuario_id: usuarioId, order_dir: orderDir },
    page,
  )

  useEffect(() => { setPage(1) }, [tipo, fromDate, toDate, search, usuarioId, orderDir])

  function openModal(t: 'entrada' | 'saida') {
    setDefaultTipo(t)
    setModalOpen(true)
  }

  const titulo = TITULOS[tipoFixo ?? ''] ?? 'Movimentações'
  const filters = { tipo, from_date: fromDate, to_date: toDate, search, usuario_id: usuarioId, order_dir: orderDir }

  async function handleExport(format: 'pdf' | 'excel') {
    setExporting(true)
    try {
      const { data } = await listMovements(filters, 1)
      // fetch all pages if needed
      let all = data
      if (total > 20) {
        const pages = Math.ceil(total / 20)
        const rest = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) => listMovements(filters, i + 2))
        )
        all = [data, ...rest.map(r => r.data)].flat()
      }
      if (format === 'pdf') exportPDF(all, titulo)
      else exportExcel(all, titulo)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={exporting || movements.length === 0}>
            <FileSpreadsheet className="h-4 w-4 text-green-600 sm:mr-2" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={exporting || movements.length === 0}>
            <FileText className="h-4 w-4 text-destructive sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          {(!tipoFixo || tipoFixo === 'saida') && (
            <Button variant="outline" size="sm" onClick={() => setLoteOpen(true)}>
              <PackageMinus className="h-4 w-4 text-destructive sm:mr-2" />
              <span className="hidden sm:inline">Saída em lote</span>
            </Button>
          )}
          {(!tipoFixo || tipoFixo === 'saida') && (
            <Button variant="outline" size="sm" onClick={() => openModal('saida')}>
              <ArrowUpCircle className="h-4 w-4 text-destructive sm:mr-2" />
              <span className="hidden sm:inline">Nova Saída</span>
            </Button>
          )}
          {(!tipoFixo || tipoFixo === 'entrada') && (
            <Button size="sm" onClick={() => openModal('entrada')}>
              <ArrowDownCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nova Entrada</span>
            </Button>
          )}
          {tipoFixo === 'ajuste' && (
            <Button size="sm" onClick={() => openModal('entrada')}>
              <ArrowDownCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Ajuste</span>
            </Button>
          )}
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
        {!tipoFixo && (
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
        )}
        <Select value={usuarioId || 'todos'} onValueChange={v => { setUsuarioId(!v || v === 'todos' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todos os usuários" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os usuários</SelectItem>
            {profiles.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome || p.username}</SelectItem>
            ))}
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
              <SortHeader
                label="Data"
                col="criado_em"
                current="criado_em"
                dir={orderDir}
                onSort={() => setOrderDir(d => d === 'asc' ? 'desc' : 'asc')}
              />
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead className="hidden sm:table-cell">Usuário</TableHead>
              <TableHead className="hidden md:table-cell">Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={8} cols={6} />
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

      <SaidaEmLoteModal open={loteOpen} onClose={() => setLoteOpen(false)} />

      <MovimentacaoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTipo={defaultTipo}
      />
    </div>
  )
}
