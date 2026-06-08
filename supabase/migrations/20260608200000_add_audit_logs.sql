CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade_id UUID,
  entidade_nome TEXT,
  campo TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_criado_em ON audit_logs(criado_em DESC);
CREATE INDEX idx_audit_logs_entidade_id ON audit_logs(entidade_id);
CREATE INDEX idx_audit_logs_usuario_id ON audit_logs(usuario_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_ve_auditoria" ON audit_logs
  FOR SELECT TO authenticated
  USING (get_user_perfil() = 'admin');
