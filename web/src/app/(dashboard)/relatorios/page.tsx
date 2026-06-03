'use client'

import { useState, useMemo } from 'react'
import { FileSpreadsheet, FileText, Search } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ProductWithCategory } from '@/services/productsService'

function exportPDF(products: ProductWithCategory[]) {
  import('jspdf').then(async ({ jsPDF }) => {
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })

    const now = new Date().toLocaleString('pt-BR')
    doc.setFontSize(16)
    doc.text('Relatório de Estoque', 14, 16)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Gerado em: ${now}`, 14, 23)

    autoTable(doc, {
      startY: 28,
      head: [['Código', 'Nome', 'Categoria', 'Un.', 'Qtd. atual', 'Qtd. mínima', 'Status']],
      body: products.map(p => [
        p.codigo,
        p.nome,
        p.category?.nome ?? '—',
        p.unidade_medida,
        p.quantidade_atual,
        p.quantidade_minima,
        p.status === 'ativo' ? 'Ativo' : 'Inativo',
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 0, 0] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const row = products[data.row.index]
          if (row && row.quantidade_atual <= row.quantidade_minima) {
            data.cell.styles.textColor = [220, 0, 0]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
    })

    doc.save(`estoque-${new Date().toISOString().slice(0, 10)}.pdf`)
  })
}

function exportExcel(products: ProductWithCategory[]) {
  import('xlsx').then(({ utils, writeFile }) => {
    const rows = products.map(p => ({
      'Código': p.codigo,
      'Nome': p.nome,
      'Categoria': p.category?.nome ?? '',
      'Unidade': p.unidade_medida,
      'Qtd. atual': p.quantidade_atual,
      'Qtd. mínima': p.quantidade_minima,
      'Status': p.status === 'ativo' ? 'Ativo' : 'Inativo',
      'Situação estoque': p.quantidade_atual === 0
        ? 'Zerado'
        : p.quantidade_atual <= p.quantidade_minima
          ? 'Abaixo do mínimo'
          : 'OK',
    }))

    const ws = utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 12 }, { wch: 32 }, { wch: 22 }, { wch: 8 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 20 },
    ]

    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Estoque')
    writeFile(wb, `estoque-${new Date().toISOString().slice(0, 10)}.xlsx`)
  })
}

export default function RelatoriosPage() {
  const [search, setSearch] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'todos'>('ativo')

  const { data: products = [], isLoading } = useProducts({ search, categoria_id: categoriaId, status }, 1, true)
  const { data: categories = [] } = useCategories()

  const stats = useMemo(() => ({
    total: products.length,
    zerados: products.filter(p => p.quantidade_atual === 0).length,
    alerta: products.filter(p => p.quantidade_atual > 0 && p.quantidade_atual <= p.quantidade_minima).length,
    ok: products.filter(p => p.quantidade_atual > p.quantidade_minima).length,
  }), [products])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportExcel(products)}
            disabled={products.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600 sm:mr-2" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportPDF(products)}
            disabled={products.length === 0}
          >
            <FileText className="h-4 w-4 text-destructive sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total filtrado', value: stats.total, color: '' },
          { label: 'Em ordem', value: stats.ok, color: 'text-primary' },
          { label: 'Estoque baixo', value: stats.alerta, color: 'text-yellow-600' },
          { label: 'Zerados', value: stats.zerados, color: 'text-destructive' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoriaId || 'todas'} onValueChange={v => setCategoriaId(!v || v === 'todas' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-48">
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
          <SelectTrigger className="w-full sm:w-36">
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
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              <TableHead className="hidden md:table-cell">Un.</TableHead>
              <TableHead className="text-right">Qtd. atual</TableHead>
              <TableHead className="text-right hidden md:table-cell">Qtd. mínima</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
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
              products.map(p => {
                const zerado = p.quantidade_atual === 0
                const baixo = !zerado && p.quantidade_atual <= p.quantidade_minima
                return (
                  <TableRow key={p.id}>
                    <TableCell className="hidden md:table-cell font-mono text-sm">{p.codigo}</TableCell>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{p.category?.nome ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{p.unidade_medida}</TableCell>
                    <TableCell className={`text-right font-semibold ${zerado ? 'text-destructive' : baixo ? 'text-yellow-600' : ''}`}>
                      {p.quantidade_atual}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right text-muted-foreground">{p.quantidade_minima}</TableCell>
                    <TableCell>
                      {zerado ? (
                        <Badge variant="destructive">Zerado</Badge>
                      ) : baixo ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">Baixo</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={p.status === 'ativo' ? 'default' : 'secondary'}>
                        {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
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
