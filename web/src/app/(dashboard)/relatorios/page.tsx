'use client'

import { useState, useMemo } from 'react'
import { FileSpreadsheet, FileText, Search } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useFornecedores } from '@/hooks/useFornecedores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ProductWithCategory } from '@/services/productsService'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

type Situacao = 'todos' | 'ok' | 'baixo' | 'zerado'

function getSituacao(p: ProductWithCategory): Situacao {
  if (p.quantidade_atual === 0) return 'zerado'
  if (p.quantidade_atual <= p.quantidade_minima) return 'baixo'
  return 'ok'
}

function exportPDF(products: ProductWithCategory[]) {
  import('jspdf').then(async ({ jsPDF }) => {
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })
    const now = new Date().toLocaleString('pt-BR')
    doc.setFontSize(16)
    doc.text('Relatório de Estoque — Snapshot', 14, 16)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Gerado em: ${now}`, 14, 23)
    autoTable(doc, {
      startY: 28,
      head: [['Código', 'Nome', 'Categoria', 'Fornecedor', 'Localização', 'Un.', 'Qtd. atual', 'Qtd. mínima', 'Vlr. unit.', 'Vlr. total', 'Situação']],
      body: products.map(p => {
        const sit = getSituacao(p)
        return [
          p.codigo ?? '',
          p.nome,
          p.category?.nome ?? '—',
          p.fornecedor?.nome ?? '—',
          p.localizacao ?? '—',
          p.unidade_medida,
          p.quantidade_atual,
          p.quantidade_minima,
          formatCurrency(p.valor_unitario ?? 0),
          formatCurrency(p.quantidade_atual * (p.valor_unitario ?? 0)),
          sit === 'zerado' ? 'Zerado' : sit === 'baixo' ? 'Baixo' : 'OK',
        ]
      }),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [220, 0, 0] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didParseCell: (data) => {
        if (data.section !== 'body') return
        const row = products[data.row.index]
        if (!row) return
        const sit = getSituacao(row)
        if (sit === 'zerado' && data.column.index === 6) {
          data.cell.styles.textColor = [220, 0, 0]
          data.cell.styles.fontStyle = 'bold'
        } else if (sit === 'baixo' && data.column.index === 6) {
          data.cell.styles.textColor = [180, 120, 0]
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    doc.save(`estoque-snapshot-${new Date().toISOString().slice(0, 10)}.pdf`)
  })
}

function exportExcel(products: ProductWithCategory[]) {
  import('xlsx').then(({ utils, writeFile }) => {
    const rows = products.map(p => ({
      'Código': p.codigo ?? '',
      'Nome': p.nome,
      'Categoria': p.category?.nome ?? '',
      'Fornecedor': p.fornecedor?.nome ?? '',
      'Localização': p.localizacao ?? '',
      'Unidade': p.unidade_medida,
      'Qtd. atual': p.quantidade_atual,
      'Qtd. mínima': p.quantidade_minima,
      'Vlr. unitário': p.valor_unitario ?? 0,
      'Vlr. total': p.quantidade_atual * (p.valor_unitario ?? 0),
      'Situação': getSituacao(p) === 'zerado' ? 'Zerado' : getSituacao(p) === 'baixo' ? 'Baixo' : 'OK',
    }))
    const ws = utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 12 }, { wch: 32 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 8 },
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
    ]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Estoque')
    writeFile(wb, `estoque-snapshot-${new Date().toISOString().slice(0, 10)}.xlsx`)
  })
}

export default function RelatoriosPage() {
  const [search, setSearch] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [fornecedorId, setFornecedorId] = useState('')
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'todos'>('ativo')
  const [situacao, setSituacao] = useState<Situacao>('todos')

  const { data: products = [], isLoading } = useProducts(
    { search, categoria_id: categoriaId, fornecedor_id: fornecedorId, status },
    1,
    true,
  )
  const { data: categories = [] } = useCategories()
  const { data: fornecedores = [] } = useFornecedores()

  const filtered = useMemo(() =>
    situacao === 'todos' ? products : products.filter(p => getSituacao(p) === situacao),
    [products, situacao],
  )

  const stats = useMemo(() => ({
    total: products.length,
    zerados: products.filter(p => p.quantidade_atual === 0).length,
    alerta: products.filter(p => p.quantidade_atual > 0 && p.quantidade_atual <= p.quantidade_minima).length,
    ok: products.filter(p => p.quantidade_atual > p.quantidade_minima).length,
    valorTotal: products.reduce((sum, p) => sum + p.quantidade_atual * (p.valor_unitario ?? 0), 0),
  }), [products])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatório de Estoque</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportExcel(filtered)} disabled={filtered.length === 0}>
            <FileSpreadsheet className="h-4 w-4 text-green-600 sm:mr-2" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF(filtered)} disabled={filtered.length === 0}>
            <FileText className="h-4 w-4 text-destructive sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total de produtos', value: stats.total.toString(), color: '', onClick: () => setSituacao('todos') },
          { label: 'Em ordem', value: stats.ok.toString(), color: 'text-primary', onClick: () => setSituacao('ok') },
          { label: 'Estoque baixo', value: stats.alerta.toString(), color: 'text-yellow-600', onClick: () => setSituacao('baixo') },
          { label: 'Zerados', value: stats.zerados.toString(), color: 'text-destructive', onClick: () => setSituacao('zerado') },
          { label: 'Valor em estoque', value: formatCurrency(stats.valorTotal), color: 'text-emerald-600', onClick: () => {} },
        ].map(({ label, value, color, onClick }) => (
          <Card
            key={label}
            className={`cursor-pointer transition-all ${onClick !== undefined && situacao !== 'todos' && label !== 'Valor em estoque' ? 'opacity-60 hover:opacity-100' : ''}`}
            onClick={onClick}
          >
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-bold truncate ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
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
        <Select value={situacao} onValueChange={v => setSituacao(v as Situacao)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as situações</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="baixo">Estoque baixo</SelectItem>
            <SelectItem value="zerado">Zerado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length !== products.length && (
        <p className="text-sm text-muted-foreground">
          Mostrando {filtered.length} de {products.length} produto{products.length !== 1 ? 's' : ''}
          {' '}— <button className="text-primary underline" onClick={() => setSituacao('todos')}>limpar filtro de situação</button>
        </p>
      )}

      {/* Tabela */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              <TableHead className="hidden xl:table-cell">Fornecedor</TableHead>
              <TableHead className="hidden lg:table-cell">Localização</TableHead>
              <TableHead className="hidden md:table-cell">Un.</TableHead>
              <TableHead className="text-right">Qtd. atual</TableHead>
              <TableHead className="text-right hidden md:table-cell">Qtd. mín.</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Vlr. unit.</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Vlr. total</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={8} cols={11} />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => {
                const sit = getSituacao(p)
                const zerado = sit === 'zerado'
                const baixo = sit === 'baixo'
                const valorTotal = p.quantidade_atual * (p.valor_unitario ?? 0)
                return (
                  <TableRow key={p.id}>
                    <TableCell className="hidden md:table-cell font-mono text-sm">{p.codigo ?? '—'}</TableCell>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{p.category?.nome ?? '—'}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{p.fornecedor?.nome ?? '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{p.localizacao ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{p.unidade_medida}</TableCell>
                    <TableCell className={`text-right font-semibold ${zerado ? 'text-destructive' : baixo ? 'text-yellow-600' : ''}`}>
                      {p.quantidade_atual}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right text-muted-foreground">{p.quantidade_minima}</TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-muted-foreground text-sm">
                      {formatCurrency(p.valor_unitario ?? 0)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right font-medium text-sm">
                      {valorTotal > 0 ? formatCurrency(valorTotal) : '—'}
                    </TableCell>
                    <TableCell>
                      {zerado ? (
                        <Badge variant="destructive">Zerado</Badge>
                      ) : baixo ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">Baixo</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
