export type ProductStatus = 'ativo' | 'inativo'

export interface Category {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  criado_em: string
}

export interface Product {
  id: string
  codigo: string
  nome: string
  categoria_id: string
  fornecedor_id: string | null
  descricao: string | null
  unidade_medida: string
  quantidade_atual: number
  quantidade_minima: number
  valor_unitario: number
  localizacao: string | null
  status: ProductStatus
  criado_em: string
  category?: Category
  fornecedor?: { id: string; nome: string } | null
}
