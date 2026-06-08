'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  ClipboardList,
  Sparkles,
  Briefcase,
  Coffee,
  Monitor,
  Shield,
  Eye,
  PackagePlus,
  PackageMinus,
  FileBarChart,
  PlusCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useDashboard } from '@/hooks/useDashboard'
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const CAT_COLORS = [
  { iconBg: 'bg-blue-100', iconText: 'text-blue-600', bar: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50' },
  { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', bar: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
  { iconBg: 'bg-amber-100', iconText: 'text-amber-600', bar: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50' },
  { iconBg: 'bg-purple-100', iconText: 'text-purple-600', bar: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-50' },
]

function getCategoryIcon(nome: string) {
  const lower = nome.toLowerCase()
  if (lower.includes('limpeza')) return Sparkles
  if (lower.includes('escritório') || lower.includes('escritorio') || lower.includes('papelaria')) return Briefcase
  if (lower.includes('copa') || lower.includes('cozinha') || lower.includes('café') || lower.includes('cafe')) return Coffee
  if (lower.includes('informática') || lower.includes('informatica') || lower.includes('ti')) return Monitor
  if (lower.includes('segurança') || lower.includes('seguranca') || lower.includes('epi')) return Shield
  return Package
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  }).format(new Date(iso))
}

function SituacaoBadge({ atual, minimo }: { atual: number; minimo: number }) {
  if (atual === 0)
    return <Badge variant="destructive" className="text-xs px-2">Crítico</Badge>
  if (atual <= minimo)
    return <Badge className="text-xs px-2 bg-amber-500 hover:bg-amber-600 text-white">Baixo</Badge>
  return <Badge className="text-xs px-2 bg-emerald-500 hover:bg-emerald-600 text-white">Normal</Badge>
}

const QUICK_ACTIONS = [
  { href: '/entradas',    label: 'Nova Entrada',        icon: PackagePlus,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { href: '/saidas',      label: 'Nova Saída',          icon: PackageMinus, color: 'text-primary',     bg: 'bg-red-50' },
  { href: '/produtos',    label: 'Novo Produto',        icon: PlusCircle,   color: 'text-blue-600',    bg: 'bg-blue-50' },
  { href: '/relatorios',  label: 'Relatório de Estoque', icon: FileBarChart, color: 'text-purple-600',  bg: 'bg-purple-50' },
]

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse"><CardContent className="pt-6 h-28" /></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-pulse"><CardContent className="pt-6 h-48" /></Card>
        <Card className="animate-pulse"><CardContent className="pt-6 h-48" /></Card>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [dias, setDias] = useState<7 | 30 | 90>(30)
  const { data, isLoading } = useDashboard(dias)
  useRealtimeDashboard()

  if (isLoading) return <LoadingSkeleton />
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Produtos */}
        <Link href="/produtos">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total de Produtos</CardTitle>
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold">{data.totalProdutos.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground mt-1">cadastrados e ativos</p>
            </CardContent>
          </Card>
        </Link>

        {/* Valor do Estoque */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Valor do Estoque</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-emerald-700 leading-tight">{formatCurrency(data.valorEstoque)}</p>
            <p className="text-xs text-muted-foreground mt-1">Valor total em estoque <span className="text-emerald-500">●</span></p>
          </CardContent>
        </Card>

        {/* Estoque Baixo */}
        <Link href="/alertas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Itens com Estoque Baixo</CardTitle>
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', data.produtosAlerta > 0 ? 'bg-amber-50' : 'bg-muted')}>
                <AlertTriangle className={cn('h-5 w-5', data.produtosAlerta > 0 ? 'text-amber-500' : 'text-muted-foreground')} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={cn('text-3xl font-bold', data.produtosAlerta > 0 ? 'text-amber-600' : '')}>{data.produtosAlerta}</p>
              <p className="text-xs text-muted-foreground mt-1">Requer atenção <span className={data.produtosAlerta > 0 ? 'text-amber-500' : ''}>🔔</span></p>
            </CardContent>
          </Card>
        </Link>

        {/* Em Falta */}
        <Link href="/alertas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Itens em Falta</CardTitle>
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', data.produtosZerados > 0 ? 'bg-red-50' : 'bg-muted')}>
                <TrendingDown className={cn('h-5 w-5', data.produtosZerados > 0 ? 'text-destructive' : 'text-muted-foreground')} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={cn('text-3xl font-bold', data.produtosZerados > 0 ? 'text-destructive' : '')}>{data.produtosZerados}</p>
              <p className="text-xs text-muted-foreground mt-1">Sem estoque <span className={data.produtosZerados > 0 ? 'text-destructive' : ''}>●</span></p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─── Categorias + Gráfico ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estoque por Categoria */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Estoque por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categorias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.categorias.map((cat, i) => {
                  const color = CAT_COLORS[i % CAT_COLORS.length]!
                  const Icon = getCategoryIcon(cat.nome)
                  return (
                    <div key={cat.id} className={cn('rounded-xl p-4 flex flex-col gap-3 border', color.light)}>
                      {/* Icon thumbnail */}
                      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', color.iconBg)}>
                        <Icon className={cn('h-6 w-6', color.iconText)} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground leading-tight mb-1">{cat.nome}</p>
                        <p className={cn('text-2xl font-bold', color.text)}>{cat.total}</p>
                        <p className="text-xs text-muted-foreground">Itens</p>
                        {cat.valorTotal > 0 && (
                          <p className="text-xs font-medium mt-1">Valor: {formatCurrency(cat.valorTotal)}</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Estoque OK</span>
                          <span className={cn('text-xs font-bold', color.text)}>{cat.percentualSaudavel}%</span>
                        </div>
                        <div className="w-full bg-white/70 rounded-full h-1.5">
                          <div className={cn('h-1.5 rounded-full', color.bar)} style={{ width: `${cat.percentualSaudavel}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico Movimentações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Movimentações (últimos {dias} dias)
            </CardTitle>
            <div className="flex gap-1">
              {([7, 30, 90] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDias(d)}
                  className={cn(
                    'text-xs px-2 py-1 rounded-md border transition-colors',
                    dias === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={data.chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} labelStyle={{ fontWeight: 600 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#dc2626" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="transferencias" name="Transferências" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Tabela + Ações Rápidas + Últimas Entradas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos com Estoque Baixo */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Produtos com Estoque Baixo</CardTitle>
            <Link href="/produtos" className="text-xs text-primary hover:underline font-medium">
              Ver todos os produtos
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.produtosCriticos.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-6">Nenhum produto cadastrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Produto</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3 hidden sm:table-cell">Categoria</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3">Estoque Atual</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 hidden md:table-cell">Estoque Mínimo</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3">Situação</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.produtosCriticos.map(p => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm leading-none">{p.nome}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">Ref: {p.codigo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{p.categoria_nome}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-semibold text-sm">{p.quantidade_atual}</span>
                          <span className="text-xs text-muted-foreground ml-1">{p.unidade_medida}</span>
                        </td>
                        <td className="px-3 py-3 text-center hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{p.quantidade_minima} {p.unidade_medida}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <SituacaoBadge atual={p.quantidade_atual} minimo={p.quantidade_minima} />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Link href={`/produtos/${p.id}`} className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna direita */}
        <div className="flex flex-col gap-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, bg }) => (
                  <Link
                    key={href + label}
                    href={href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:shadow-sm transition-all text-center group"
                  >
                    <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', bg)}>
                      <Icon className={cn('h-5 w-5', color)} />
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Últimas Entradas */}
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Últimas Entradas</CardTitle>
              <Link href="/entradas" className="text-xs text-primary hover:underline font-medium">
                Ver todas
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {data.ultimasMovs.length === 0 ? (
                <p className="text-sm text-muted-foreground px-4 pb-4">Nenhuma entrada registrada.</p>
              ) : (
                <div className="divide-y">
                  {data.ultimasMovs.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{m.product?.nome ?? '—'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {m.profile?.nome ?? m.profile?.username ?? 'Sistema'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-emerald-600">+{m.quantidade} {m.product?.unidade_medida}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(m.criado_em)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
