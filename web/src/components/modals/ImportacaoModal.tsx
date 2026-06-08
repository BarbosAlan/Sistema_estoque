'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface ImportRow {
  nome: string
  codigo?: string
  unidade_medida?: string
  quantidade_atual?: number
  quantidade_minima?: number
  valor_unitario?: number
  categoria?: string
  fornecedor?: string
  localizacao?: string
  descricao?: string
  _error?: string
}

const TEMPLATE_CSV = [
  'nome,codigo,unidade_medida,quantidade_atual,quantidade_minima,valor_unitario,categoria,fornecedor,localizacao,descricao',
  'Papel A4,PAP001,resma,100,20,25.90,Escritório,,A1-P1,Papel sulfite branco',
  'Caneta Azul,CAN001,un,50,10,2.50,Escritório,,,',
].join('\n')

const COL_MAP: Record<string, keyof Omit<ImportRow, '_error'>> = {
  nome: 'nome', name: 'nome',
  codigo: 'codigo', código: 'codigo', code: 'codigo',
  unidade_medida: 'unidade_medida', unidade: 'unidade_medida', unit: 'unidade_medida',
  quantidade_atual: 'quantidade_atual', quantidade: 'quantidade_atual', qtd: 'quantidade_atual', qty: 'quantidade_atual',
  quantidade_minima: 'quantidade_minima', minimo: 'quantidade_minima', qtd_minima: 'quantidade_minima', mínimo: 'quantidade_minima',
  valor_unitario: 'valor_unitario', valor: 'valor_unitario', preco: 'valor_unitario', preço: 'valor_unitario', price: 'valor_unitario',
  categoria: 'categoria', category: 'categoria',
  fornecedor: 'fornecedor', supplier: 'fornecedor',
  localizacao: 'localizacao', localização: 'localizacao', location: 'localizacao',
  descricao: 'descricao', descrição: 'descricao', description: 'descricao',
}

const NUMBER_COLS = new Set<keyof ImportRow>(['quantidade_atual', 'quantidade_minima', 'valor_unitario'])

function parseRows(sheetData: Record<string, unknown>[]): ImportRow[] {
  return sheetData
    .map(raw => {
      const row: ImportRow = { nome: '' }
      for (const [key, val] of Object.entries(raw)) {
        const mapped = COL_MAP[key.toLowerCase().trim().replace(/\s+/g, '_')]
        if (!mapped) continue
        const str = String(val ?? '').trim()
        if (NUMBER_COLS.has(mapped)) {
          const n = parseFloat(str.replace(',', '.'))
          ;(row as unknown as Record<string, unknown>)[mapped] = isNaN(n) ? 0 : n
        } else {
          ;(row as unknown as Record<string, unknown>)[mapped] = str || undefined
        }
      }
      if (!row.nome) row._error = 'Nome obrigatório'
      return row
    })
    .filter(r => r.nome || r._error)
}

interface ImportResult {
  created: number
  updated: number
  errors: { row: number; message: string }[]
}

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'upload' | 'preview' | 'result'

export function ImportacaoModal({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  function reset() {
    setStep('upload')
    setRows([])
    setResult(null)
    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_importacao_produtos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { read, utils } = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = read(buffer, { type: 'array' })
      const sheetName = wb.SheetNames[0] ?? ''
      const ws = wb.Sheets[sheetName]
      if (!ws) { toast.error('Planilha vazia ou inválida.'); return }
      const json = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
      const parsed = parseRows(json)
      if (parsed.length === 0) {
        toast.error('Nenhuma linha válida encontrada no arquivo.')
        return
      }
      setRows(parsed)
      setStep('preview')
    } catch {
      toast.error('Erro ao ler o arquivo. Verifique o formato.')
    }
  }

  async function handleImport() {
    const validRows = rows.filter(r => !r._error).map(({ _error: _, ...r }) => r)
    if (validRows.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao importar')
      setResult(json)
      setStep('result')
      qc.invalidateQueries({ queryKey: ['products'] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao importar')
    } finally {
      setLoading(false)
    }
  }

  const validCount = rows.filter(r => !r._error).length
  const errorCount = rows.filter(r => !!r._error).length

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>
            {step === 'upload' && 'Importar produtos'}
            {step === 'preview' && `Prévia — ${rows.length} linha${rows.length !== 1 ? 's' : ''}`}
            {step === 'result' && 'Importação concluída'}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col gap-5 p-6">
            <p className="text-sm text-muted-foreground">
              Importe múltiplos produtos de uma vez via arquivo CSV ou Excel (.xlsx).
              Produtos com o mesmo <strong>código</strong> serão atualizados em vez de duplicados.
            </p>

            <Button variant="outline" size="sm" className="w-fit" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar modelo CSV
            </Button>

            <label className="flex flex-col items-center gap-3 border-2 border-dashed rounded-xl py-10 px-6 cursor-pointer hover:bg-accent/40 transition-colors">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium text-sm">Clique para selecionar o arquivo</p>
                <p className="text-xs text-muted-foreground mt-1">CSV ou XLSX · máximo 500 linhas</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </div>
        )}

        {step === 'preview' && (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/30">
              {validCount > 0 && (
                <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-200">
                  <CheckCircle className="h-3 w-3" />
                  {validCount} válida{validCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {errorCount} com erro
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={reset}>
                <Upload className="h-3 w-3 mr-1" />
                Trocar arquivo
              </Button>
            </div>

            <div className="overflow-auto flex-1 max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 text-xs">#</TableHead>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Unidade</TableHead>
                    <TableHead className="text-right text-xs">Qtd.</TableHead>
                    <TableHead className="text-right text-xs">Mín.</TableHead>
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={r._error ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{r.nome || <span className="text-destructive">—</span>}</TableCell>
                      <TableCell className="font-mono text-xs">{r.codigo || '—'}</TableCell>
                      <TableCell className="text-sm">{r.unidade_medida || 'un'}</TableCell>
                      <TableCell className="text-right text-sm">{r.quantidade_atual ?? 0}</TableCell>
                      <TableCell className="text-right text-sm">{r.quantidade_minima ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.categoria || '—'}</TableCell>
                      <TableCell>
                        {r._error ? (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="h-3 w-3 shrink-0" />
                            {r._error}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            OK
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleImport} disabled={validCount === 0 || loading}>
                {loading ? 'Importando...' : `Importar ${validCount} produto${validCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="flex flex-col gap-5 p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-green-50 dark:bg-green-950/20 p-4 text-center">
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">{result.created}</p>
                <p className="text-sm text-muted-foreground mt-1">Criados</p>
              </div>
              <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/20 p-4 text-center">
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{result.updated}</p>
                <p className="text-sm text-muted-foreground mt-1">Atualizados</p>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-xl border bg-destructive/5 p-4 text-center col-span-2 sm:col-span-1">
                  <p className="text-3xl font-bold text-destructive">{result.errors.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Erros</p>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1 max-h-36 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive">Linha {e.row}: {e.message}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
