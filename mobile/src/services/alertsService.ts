import { supabase } from '@/lib/supabase'

export type AlertProduct = {
  id: string
  nome: string
  codigo: string
  unidade_medida: string
  quantidade_atual: number
  quantidade_minima: number
  tipo: 'zerado' | 'estoque_baixo'
  category: { nome: string } | null
}

export const alertsService = {
  async getAlertas(): Promise<AlertProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select('id, nome, codigo, unidade_medida, quantidade_atual, quantidade_minima, category:categories(nome)')
      .eq('status', 'ativo')
      .order('quantidade_atual', { ascending: true })

    if (error) throw error

    return (data ?? [])
      .filter(p => p.quantidade_atual === 0 || (p.quantidade_minima > 0 && p.quantidade_atual <= p.quantidade_minima))
      .map(p => ({
        ...p,
        category: p.category as { nome: string } | null,
        tipo: p.quantidade_atual === 0 ? 'zerado' as const : 'estoque_baixo' as const,
      }))
  },
}
