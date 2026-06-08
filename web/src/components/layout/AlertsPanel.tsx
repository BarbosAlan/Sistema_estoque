'use client'

import { useState } from 'react'
import { Bell, AlertTriangle, Package, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

interface AlertProduct {
  id: string
  nome: string
  codigo: string
  unidade_medida: string
  quantidade_atual: number
  quantidade_minima: number
}

function useAlertsData() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await fetch('/api/alerts')
      if (!res.ok) return { zerados: [] as AlertProduct[], baixo: [] as AlertProduct[] }
      const { data } = await res.json()
      return data as { zerados: AlertProduct[]; baixo: AlertProduct[] }
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

interface AlertsPanelProps {
  alertCount: number
}

export function AlertsPanel({ alertCount }: AlertsPanelProps) {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useAlertsData()

  const zerados = data?.zerados ?? []
  const baixo = data?.baixo ?? []
  const total = zerados.length + baixo.length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
        title="Alertas de estoque"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border bg-popover shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Alertas de estoque</span>
              </div>
              {total > 0 && (
                <span className="text-xs font-bold bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">
                  {total}
                </span>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Carregando...
                </div>
              ) : total === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
                </div>
              ) : (
                <>
                  {zerados.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-xs font-semibold text-destructive uppercase tracking-wide">
                          Zerados ({zerados.length})
                        </span>
                      </div>
                      {zerados.map(p => (
                        <Link
                          key={p.id}
                          href={`/produtos/${p.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                        >
                          <div className="h-7 w-7 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{p.nome}</p>
                            <p className="text-xs text-muted-foreground font-mono">{p.codigo}</p>
                          </div>
                          <span className="text-xs font-bold text-destructive shrink-0">
                            0 {p.unidade_medida}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {baixo.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                          Estoque baixo ({baixo.length})
                        </span>
                      </div>
                      {baixo.map(p => (
                        <Link
                          key={p.id}
                          href={`/produtos/${p.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                        >
                          <div className="h-7 w-7 rounded-md bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{p.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.quantidade_atual} / {p.quantidade_minima} {p.unidade_medida}
                            </p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t px-4 py-2.5">
              <Link
                href="/alertas"
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Ver todos os alertas →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
