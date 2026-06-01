export interface AlertProduct {
  id: string
  nome: string
  codigo: string
  unidade_medida: string
  quantidade_atual: number
  quantidade_minima: number
  category: { nome: string } | null
}

export interface AlertsData {
  zerados: AlertProduct[]
  baixo: AlertProduct[]
}

export async function getAlerts(): Promise<AlertsData> {
  const res = await fetch('/api/alerts')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao carregar alertas')
  return json.data
}
