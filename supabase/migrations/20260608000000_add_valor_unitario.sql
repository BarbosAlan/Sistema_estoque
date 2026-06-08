-- Adiciona campo de valor unitário nos produtos para calcular valor total do estoque
ALTER TABLE products
ADD COLUMN valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0;
