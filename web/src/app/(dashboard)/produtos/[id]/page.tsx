'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useMovements } from '@/hooks/useMovements'
import { ArrowLeft, Package, Tag, Truck, MapPin, DollarSign, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
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

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

async function fetchProduct(id: string) {
  const res = await fetch(`/api/products/${id}`)
  if (!res.ok) throw new Error('Produto não encontrado')
  return (await res.json()).data
}

function buildChartData(movements: { tipo: MovementType; quantidade: number; criado_em: string }[]) {
  const byDay: Record<string, { entradas: number; saidas: number }> = {}
  for (const m of [...movements].reverse()) {
    const day = m.criado_em.slice(0, 10)
    if (!byDay[day]) byDay[day] = { entradas: 0, saidas: 0 }
    if (['entrada', 'ajuste_entrada'].includes(m.tipo)) byDay[day].entradas += m.quantidade
    else byDay[day].saidas += m.quantidade
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date: formatDate(date + 'T00:00:00'), ...vals }))
}

export default function ProdutoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  })

  const { data: movements = [], isLoading: loadingMovs } = useMovements(
    { produto_id: id },
    1,
  )

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/produtos')}>
          Voltar
        </Button>
      </div>
    )
  }

  const valorEstoque = product.quantidade_atual * (product.valor_unitario ?? 0)
  const zerado = product.quantidade_atual === 0
  const baixo = !zerado && product.quantidade_atual <= product.quantidade_minima
  const chartData = buildChartData(movements)

  const kpis = [
    {
      label: 'Quantidade atual',
      value: `${product.quantidade_atual} ${product.unidade_medida}`,
      icon: Package,
      color: zerado ? 'text-destructive' : baixo ? 'text-yellow-600' : 'text-blue-600',
      bg: zerado ? 'bg-red-50' : baixo ? 'bg-yellow-50' : 'bg-blue-50',
    },
    {
      label: 'Quantidade mínima',
      value: `${product.quantidade_minima} ${product.unidade_medida}`,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Valor unitário',
      value: formatCurrency(product.valor_unitario ?? 0),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Valor em estoque',
      value: formatCurrency(valorEstoque),
      icon: TrendingDown,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{product.nome}</h1>
            <Badge variant={product.status === 'ativo' ? 'default' : 'secondary'}>
              {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </Badge>
            {zerado && <Badge variant="destructive">Zerado</Badge>}
            {baixo && <Badge variant="outline" className="border-yellow-500 text-yellow-600">Estoque baixo</Badge>}
          </div>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">{product.codigo}</p>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-3">
        {product.category && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
            <Tag className="h-3.5 w-3.5" />
            {product.category.nome}
          </div>
        )}
        {product.fornecedor && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
            <Truck className="h-3.5 w-3.5" />
            {product.fornecedor.nome}
          </div>
        )}
        {product.localizacao && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
            <MapPin className="h-3.5 w-3.5" />
            {product.localizacao}
          </div>
        )}
        {product.descricao && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
            {product.descricao}
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-lg font-bold truncate ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Movimentações recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="entradas" stroke="#16a34a" strokeWidth={2} dot={false} name="Entradas" />
                <Line type="monotone" dataKey="saidas" stroke="#dc2626" strokeWidth={2} dot={false} name="Saídas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Movement history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="hidden sm:table-cell">Usuário</TableHead>
                  <TableHead className="hidden md:table-cell">Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMovs ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma movimentação registrada.</TableCell>
                  </TableRow>
                ) : (
                  movements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(m.criado_em)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={TIPO_VARIANTS[m.tipo]}>{TIPO_LABELS[m.tipo]}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {['saida', 'ajuste_saida'].includes(m.tipo) ? '-' : '+'}
                        {m.quantidade} {product.unidade_medida}
                      </TableCell>
                      <TableCell className="text-sm hidden sm:table-cell">
                        {m.profile?.nome ?? m.profile?.username ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {m.motivo ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
