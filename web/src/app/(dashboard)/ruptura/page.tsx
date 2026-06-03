'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingDown, AlertTriangle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type ForecastItem = {
  id: string
  nome: string
  codigo: string
  unidade_medida: string
  quantidade_atual: number
  quantidade_minima: number
  categoria: string
  consumo_30_dias: number
  consumo_diario: number
  dias_restantes: number | null
}

function urgencia(dias: number | null): 'critico' | 'risco' | 'ok' | 'sem_movimento' {
  if (dias === null) return 'sem_movimento'
  if (dias <= 7) return 'critico'
  if (dias <= 14) return 'risco'
  return 'ok'
}

export default function RupturaPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['forecast'],
    queryFn: async () => {
      const res = await fetch('/api/products/forecast')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao carregar previsão')
      return json.data as ForecastItem[]
    },
  })

  const criticos = items.filter(i => urgencia(i.dias_restantes) === 'critico')
  const risco    = items.filter(i => urgencia(i.dias_restantes) === 'risco')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Previsão de Ruptura</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estimativa baseada no consumo médio dos últimos 30 dias.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Críticos (≤ 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{criticos.length}</span>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Em risco (8–14 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{risco.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Produtos analisados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{items.length}</span>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right hidden md:table-cell">Consumo 30d</TableHead>
              <TableHead className="text-right hidden md:table-cell">Consumo/dia</TableHead>
              <TableHead className="text-right">Dias restantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Calculando...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map(item => {
                const u = urgencia(item.dias_restantes)
                return (
                  <TableRow
                    key={item.id}
                    className={
                      u === 'critico' ? 'bg-destructive/5' :
                      u === 'risco'   ? 'bg-yellow-50/50 dark:bg-yellow-900/10' :
                      ''
                    }
                  >
                    <TableCell>
                      <div className="font-medium">{item.nome}</div>
                      <div className="text-xs font-mono text-muted-foreground">{item.codigo}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {item.categoria}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {item.quantidade_atual}
                      <span className="text-xs text-muted-foreground ml-1">{item.unidade_medida}</span>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground">
                      {item.consumo_30_dias}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground">
                      {item.consumo_diario > 0 ? item.consumo_diario.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.dias_restantes === null ? (
                        <Badge variant="outline" className="text-xs">Sem movimento</Badge>
                      ) : (
                        <Badge
                          variant={u === 'critico' ? 'destructive' : 'outline'}
                          className={u === 'risco' ? 'border-yellow-500 text-yellow-700' : ''}
                        >
                          {item.dias_restantes} {item.dias_restantes === 1 ? 'dia' : 'dias'}
                        </Badge>
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
