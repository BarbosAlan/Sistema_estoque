ALTER TABLE products
  ADD COLUMN fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL;
