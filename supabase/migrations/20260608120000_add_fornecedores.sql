-- Tabela de fornecedores
CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  observacao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fornecedores_ativo ON fornecedores(ativo);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler fornecedores"
  ON fornecedores FOR SELECT TO authenticated USING (true);

CREATE POLICY "Estoquistas e admins podem inserir fornecedores"
  ON fornecedores FOR INSERT TO authenticated
  WITH CHECK (get_user_perfil() IN ('admin', 'estoquista'));

CREATE POLICY "Estoquistas e admins podem atualizar fornecedores"
  ON fornecedores FOR UPDATE TO authenticated
  USING (get_user_perfil() IN ('admin', 'estoquista'));
