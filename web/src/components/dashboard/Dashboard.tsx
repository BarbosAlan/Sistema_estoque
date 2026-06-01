'use client'

import Link from 'next/link'
import { Package, AlertTriangle, ArrowLeftRight, TrendingDown } from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function StockBar({ atual, minimo }: { atual: number; minimo: number }) {
  const max = Math.max(minimo * 2, atual, 1)
  const pct = Math.min((atual / max) * 100, 100)
  const critical = atual === 0
  const low = atual <= minimo

  return (
    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all ${critical ? 'bg-destructive' : low ? 'bg-yellow-500' : 'bg-primary'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Dashboard() {
  const { data, isLoading } = useDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 h-24" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const cards = [
    {
      title: 'Produtos ativos',
      value: data.totalProdutos,
      icon: Package,
      href: '/produtos',
      color: 'text-foreground',
      sub: 'cadastrados e ativos',
    },
    {
      title: 'Estoque baixo',
      value: data.produtosAlerta,
      icon: AlertTriangle,
      href: '/produtos',
      color: data.produtosAlerta > 0 ? 'text-yellow-600' : 'text-muted-foreground',
      sub: 'abaixo do mínimo',
    },
    {
      title: 'Zerados',
      value: data.produtosZerados,
      icon: TrendingDown,
      href: '/produtos',
      color: data.produtosZerados > 0 ? 'text-destructive' : 'text-muted-foreground',
      sub: 'sem estoque',
    },
    {
      title: 'Movimentos hoje',
      value: data.movsHoje,
      icon: ArrowLeftRight,
      href: '/movimentacoes',
      color: 'text-foreground',
      sub: `${data.movesMes} no mês`,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ title, value, icon: Icon, href, color, sub }) => (
          <Link key={title} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas movimentações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Últimas movimentações</CardTitle>
            <Link href="/movimentacoes" className="text-xs text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.ultimasMovs.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-6">Nenhuma movimentação ainda.</p>
            ) : (
              <div className="divide-y">
                {data.ultimasMovs.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-6 py-3">
                    <Badge variant={TIPO_VARIANTS[m.tipo]} className="shrink-0 text-xs">
                      {TIPO_LABELS[m.tipo]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.product?.nome ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.profile?.nome ?? m.profile?.username ?? '—'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {['saida', 'ajuste_saida'].includes(m.tipo) ? '-' : '+'}
                        {m.quantidade} {m.product?.unidade_medida}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(m.criado_em)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produtos críticos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Produtos com menor estoque</CardTitle>
            <Link href="/produtos" className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.produtosCriticos.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-6">Nenhum produto cadastrado.</p>
            ) : (
              <div className="divide-y">
                {data.produtosCriticos.map(p => (
                  <div key={p.id} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-xs font-mono text-muted-foreground">{p.codigo}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className={`text-sm font-bold ${p.quantidade_atual === 0 ? 'text-destructive' : p.quantidade_atual <= p.quantidade_minima ? 'text-yellow-600' : ''}`}>
                          {p.quantidade_atual}
                        </span>
                        <span className="text-xs text-muted-foreground"> / {p.quantidade_minima} {p.unidade_medida}</span>
                      </div>
                    </div>
                    <StockBar atual={p.quantidade_atual} minimo={p.quantidade_minima} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
