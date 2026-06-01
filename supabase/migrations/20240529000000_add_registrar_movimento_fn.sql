-- Atomic function to register a stock movement and update product quantity
CREATE OR REPLACE FUNCTION registrar_movimento(
  p_produto_id    UUID,
  p_tipo          TEXT,
  p_quantidade    INTEGER,
  p_motivo        TEXT,
  p_observacao    TEXT,
  p_usuario_id    UUID
) RETURNS movements AS $$
DECLARE
  v_produto        products%ROWTYPE;
  v_nova_qtd       INTEGER;
  v_movimento      movements%ROWTYPE;
BEGIN
  SELECT * INTO v_produto FROM products WHERE id = p_produto_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;

  IF v_produto.status = 'inativo' THEN
    RAISE EXCEPTION 'Produto inativo não pode ter movimentação';
  END IF;

  IF p_tipo IN ('entrada', 'ajuste_entrada') THEN
    v_nova_qtd := v_produto.quantidade_atual + p_quantidade;
  ELSE
    IF v_produto.quantidade_atual < p_quantidade THEN
      RAISE EXCEPTION 'Estoque insuficiente. Disponível: %', v_produto.quantidade_atual;
    END IF;
    v_nova_qtd := v_produto.quantidade_atual - p_quantidade;
  END IF;

  INSERT INTO movements (produto_id, usuario_id, tipo, quantidade, motivo, observacao)
  VALUES (p_produto_id, p_usuario_id, p_tipo, p_quantidade, p_motivo, p_observacao)
  RETURNING * INTO v_movimento;

  UPDATE products SET quantidade_atual = v_nova_qtd WHERE id = p_produto_id;

  RETURN v_movimento;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
