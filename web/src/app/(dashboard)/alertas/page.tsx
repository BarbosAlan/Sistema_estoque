'use client'

import { useState } from 'react'
import { AlertTriangle, CircleOff, ArrowDownCircle, CheckCircle2 } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MovimentacaoFormModal } from '@/components/forms/MovimentacaoForm'
import type { AlertProduct } from '@/services/alertsService'

function AlertRow({
  product,
  onEntrada,
}: {
  product: AlertProduct
  onEntrada: (p: AlertProduct) => void
}) {
  const pct = product.quantidade_minima > 0
    ? Math.round((product.quantidade_atual / product.quantidade_minima) * 100)
    : 0

  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{product.nome}</span>
          <span className="font-mono text-xs text-muted-foreground">{product.codigo}</span>
          {product.category && (
            <Badge variant="outline" className="text-xs">{product.category.nome}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-muted-foreground">
            Atual: <strong className={product.quantidade_atual === 0 ? 'text-destructive' : 'text-yellow-600'}>
              {product.quantidade_atual}
            </strong>
            {' '}{product.unidade_medida}
          </span>
          <span className="text-sm text-muted-foreground">
            Mínimo: <strong>{product.quantidade_minima}</strong> {product.unidade_medida}
          </span>
          {product.quantidade_minima > 0 && (
            <span className="text-xs text-muted-foreground">{pct}% do mínimo</span>
          )}
        </div>
        {product.quantidade_minima > 0 && (
          <div className="w-48 bg-muted rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full ${product.quantidade_atual === 0 ? 'bg-destructive' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={() => onEntrada(product)}>
        <ArrowDownCircle className="mr-2 h-4 w-4" />
        Registrar entrada
      </Button>
    </div>
  )
}

export default function AlertasPage() {
  const { data, isLoading } = useAlerts()
  const qc = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState<AlertProduct | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function handleEntrada(product: AlertProduct) {
    setSelectedProduct(product)
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setSelectedProduct(null)
    qc.invalidateQueries({ queryKey: ['alerts'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const total = (data?.zerados.length ?? 0) + (data?.baixo.length ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alertas de estoque</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {total === 0
                ? 'Nenhum alerta no momento.'
                : `${total} produto${total > 1 ? 's' : ''} precisando de atenção`}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 h-32" />
            </Card>
          ))}
        </div>
      ) : total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
            <p className="text-lg font-semibold">Tudo em ordem!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhum produto com estoque baixo ou zerado no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Zerados */}
          {data!.zerados.length > 0 && (
            <Card className="border-destructive/40">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <CircleOff className="h-4 w-4" />
                  Sem estoque — {data!.zerados.length} produto{data!.zerados.length > 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 p-0">
                {data!.zerados.map(p => (
                  <AlertRow key={p.id} product={p} onEntrada={handleEntrada} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Estoque baixo */}
          {data!.baixo.length > 0 && (
            <Card className="border-yellow-500/40">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-base text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  Estoque baixo — {data!.baixo.length} produto{data!.baixo.length > 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 p-0">
                {data!.baixo.map(p => (
                  <AlertRow key={p.id} product={p} onEntrada={handleEntrada} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <MovimentacaoFormModal
        open={modalOpen}
        onClose={handleClose}
        defaultTipo="entrada"
        defaultProdutoId={selectedProduct?.id}
      />
    </div>
  )
}
