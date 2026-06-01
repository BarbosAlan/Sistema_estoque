-- Trigger: cria automaticamente um registro em profiles quando um novo usuário é criado no auth.users
-- Os campos nome, perfil e username são lidos de raw_user_meta_data.
-- Fallbacks: nome e username derivados do e-mail, perfil padrão = 'funcionario'.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_base_username TEXT;
BEGIN
  v_base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  v_username := v_base_username;

  -- Evita conflito de username único adicionando sufixo do UUID
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_base_username || '_' || substring(NEW.id::text, 1, 4);
  END IF;

  INSERT INTO public.profiles (id, nome, perfil, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'funcionario'),
    v_username
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
