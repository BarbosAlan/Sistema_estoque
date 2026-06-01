import { supabase } from '@/lib/supabase'

export const movementsService = {
  async registrarSaida(params: {
    produto_id: string
    quantidade: number
    motivo?: string
    usuario_id: string
  }) {
    const { data, error } = await supabase.rpc('registrar_movimento', {
      p_produto_id: params.produto_id,
      p_tipo: 'saida',
      p_quantidade: params.quantidade,
      p_motivo: params.motivo ?? null,
      p_observacao: null,
      p_usuario_id: params.usuario_id,
    })
    if (error) throw error
    return data
  },

  async getRecentes(limit = 8) {
    const { data, error } = await supabase
      .from('movements')
      .select('id, tipo, quantidade, motivo, criado_em, produto:products(nome, codigo)')
      .order('criado_em', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data ?? []
  },
}
