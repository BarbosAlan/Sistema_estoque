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
  descricao: string | null
  unidade_medida: string
  quantidade_atual: number
  quantidade_minima: number
  localizacao: string | null
  status: ProductStatus
  criado_em: string
  category?: Category
}
