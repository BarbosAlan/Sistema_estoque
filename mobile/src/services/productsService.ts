import { supabase } from '@/lib/supabase'

export const productsService = {
  async getAll(search?: string) {
    let query = supabase
      .from('products')
      .select('id, codigo, nome, quantidade_atual, quantidade_minima, unidade_medida, category:categories(nome)')
      .eq('status', 'ativo')
      .order('nome')

    if (search && search.trim()) {
      query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async getSummary() {
    const { data, error } = await supabase
      .from('products')
      .select('id, quantidade_atual, quantidade_minima')
      .eq('status', 'ativo')

    if (error) throw error
    const products = data ?? []
    return {
      total: products.length,
      zerados: products.filter(p => p.quantidade_atual === 0).length,
      criticos: products.filter(
        p => p.quantidade_minima > 0 && p.quantidade_atual > 0 && p.quantidade_atual <= p.quantidade_minima
      ).length,
    }
  },
}
