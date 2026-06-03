-- Previsão de ruptura: consumo médio dos últimos 30 dias × estoque atual
CREATE OR REPLACE FUNCTION get_previsao_ruptura()
RETURNS TABLE (
  id uuid,
  nome text,
  codigo text,
  unidade_medida text,
  quantidade_atual integer,
  quantidade_minima integer,
  categoria text,
  consumo_30_dias integer,
  consumo_diario numeric,
  dias_restantes integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.nome,
    p.codigo,
    p.unidade_medida,
    p.quantidade_atual,
    p.quantidade_minima,
    COALESCE(c.nome, '—') AS categoria,
    COALESCE(SUM(CASE WHEN m.tipo IN ('saida', 'ajuste_saida') THEN m.quantidade ELSE 0 END), 0)::integer AS consumo_30_dias,
    COALESCE(SUM(CASE WHEN m.tipo IN ('saida', 'ajuste_saida') THEN m.quantidade ELSE 0 END), 0)::numeric / 30.0 AS consumo_diario,
    CASE
      WHEN COALESCE(SUM(CASE WHEN m.tipo IN ('saida', 'ajuste_saida') THEN m.quantidade ELSE 0 END), 0) = 0 THEN NULL
      ELSE FLOOR(
        p.quantidade_atual::numeric /
        (COALESCE(SUM(CASE WHEN m.tipo IN ('saida', 'ajuste_saida') THEN m.quantidade ELSE 0 END), 0)::numeric / 30.0)
      )::integer
    END AS dias_restantes
  FROM products p
  LEFT JOIN categories c ON p.categoria_id = c.id
  LEFT JOIN movements m ON m.produto_id = p.id
    AND m.criado_em >= NOW() - INTERVAL '30 days'
  WHERE p.status = 'ativo'
  GROUP BY p.id, p.nome, p.codigo, p.unidade_medida, p.quantidade_atual, p.quantidade_minima, c.nome
  ORDER BY dias_restantes ASC NULLS LAST, p.nome ASC;
$$;

-- Saída em lote: executa todas as saídas em uma única transação
CREATE OR REPLACE FUNCTION registrar_movimentos_lote(
  p_itens jsonb,
  p_usuario_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_produto record;
  v_produto_id uuid;
  v_quantidade integer;
  v_motivo text;
  v_nova_qtd integer;
BEGIN
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_itens)
  LOOP
    v_produto_id := (v_item->>'produto_id')::uuid;
    v_quantidade := (v_item->>'quantidade')::integer;
    v_motivo     := v_item->>'motivo';

    SELECT * INTO v_produto
    FROM products
    WHERE id = v_produto_id AND status = 'ativo'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto não encontrado ou inativo: %', v_produto_id;
    END IF;

    v_nova_qtd := v_produto.quantidade_atual - v_quantidade;

    IF v_nova_qtd < 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente para "%": disponível %, solicitado %',
        v_produto.nome, v_produto.quantidade_atual, v_quantidade;
    END IF;

    INSERT INTO movements (produto_id, usuario_id, tipo, quantidade, motivo)
    VALUES (v_produto_id, p_usuario_id, 'saida', v_quantidade, v_motivo);

    UPDATE products SET quantidade_atual = v_nova_qtd WHERE id = v_produto_id;
  END LOOP;
END;
$$;
