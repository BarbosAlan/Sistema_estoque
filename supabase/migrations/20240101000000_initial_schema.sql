-- ============================================================
-- Migration inicial — schema completo do sistema de estoque
-- Nunca edite este arquivo. Para alterações, crie nova migration.
-- ============================================================

-- ─── PROFILES (extensão do auth.users do Supabase) ───────────
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'estoquista', 'funcionario')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  categoria_id UUID NOT NULL REFERENCES categories(id),
  descricao TEXT,
  unidade_medida TEXT NOT NULL DEFAULT 'un',
  quantidade_atual INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_atual >= 0),
  quantidade_minima INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_minima >= 0),
  localizacao TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── MOVEMENTS ───────────────────────────────────────────────
-- Imutável: sem UPDATE ou DELETE permitidos (ver RLS abaixo)
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES products(id),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste_entrada', 'ajuste_saida')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  motivo TEXT,
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ALERTS ──────────────────────────────────────────────────
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES products(id),
  tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN ('estoque_baixo', 'sem_movimento', 'zerado')),
  resolvido BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────
CREATE INDEX idx_products_categoria ON products(categoria_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_movements_produto ON movements(produto_id);
CREATE INDEX idx_movements_usuario ON movements(usuario_id);
CREATE INDEX idx_movements_tipo ON movements(tipo);
CREATE INDEX idx_movements_criado_em ON movements(criado_em DESC);
CREATE INDEX idx_alerts_produto ON alerts(produto_id);
CREATE INDEX idx_alerts_resolvido ON alerts(resolvido);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Helper para pegar o perfil do usuário logado
CREATE OR REPLACE FUNCTION get_user_perfil()
RETURNS TEXT AS $$
  SELECT raw_user_meta_data->>'perfil' FROM auth.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies: profiles
CREATE POLICY "usuarios_veem_proprio_perfil" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "admin_gerencia_perfis" ON profiles
  FOR ALL TO authenticated USING (get_user_perfil() = 'admin');

-- Policies: categories
CREATE POLICY "todos_veem_categorias" ON categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_gerencia_categorias" ON categories
  FOR ALL TO authenticated USING (get_user_perfil() = 'admin');

-- Policies: products
CREATE POLICY "todos_veem_produtos_ativos" ON products
  FOR SELECT TO authenticated
  USING (status = 'ativo' OR get_user_perfil() IN ('estoquista', 'admin'));
CREATE POLICY "estoquista_admin_gerencia_produtos" ON products
  FOR INSERT TO authenticated
  WITH CHECK (get_user_perfil() IN ('estoquista', 'admin'));
CREATE POLICY "estoquista_admin_atualiza_produtos" ON products
  FOR UPDATE TO authenticated
  USING (get_user_perfil() IN ('estoquista', 'admin'));
CREATE POLICY "admin_deleta_produtos" ON products
  FOR DELETE TO authenticated
  USING (get_user_perfil() = 'admin');

-- Policies: movements (imutável — sem UPDATE ou DELETE)
CREATE POLICY "todos_veem_movimentacoes" ON movements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "funcionario_registra_propria_saida" ON movements
  FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id = auth.uid()
    OR get_user_perfil() IN ('estoquista', 'admin')
  );

-- Policies: alerts
CREATE POLICY "estoquistas_veem_alertas" ON alerts
  FOR SELECT TO authenticated
  USING (get_user_perfil() IN ('estoquista', 'admin'));
CREATE POLICY "sistema_gerencia_alertas" ON alerts
  FOR ALL TO authenticated
  USING (get_user_perfil() IN ('estoquista', 'admin'));
