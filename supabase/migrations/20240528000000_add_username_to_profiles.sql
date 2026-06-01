-- Adiciona username à tabela profiles e cria RPC para lookup por username

ALTER TABLE profiles ADD COLUMN username TEXT NOT NULL UNIQUE;

-- Permite buscar e-mail pelo username sem expor auth.users ao cliente
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
  SELECT u.email
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE p.username = p_username
    AND p.ativo = true
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER;
