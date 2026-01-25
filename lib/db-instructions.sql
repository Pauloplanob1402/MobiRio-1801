
-- 1. Garante que a tabela 'usuarios' tenha a coluna 'creditos'
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 0;

-- 2. Garante que a tabela 'envios' tenha a coluna 'solicitante_id'
ALTER TABLE IF EXISTS envios ADD COLUMN IF NOT EXISTS solicitante_id UUID REFERENCES auth.users(id);

-- 3. Garante que a tabela 'movimentos_credito' tenha a coluna 'usuario_id'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movimentos_credito' AND column_name='usuario_id') THEN
        ALTER TABLE movimentos_credito ADD COLUMN usuario_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 4. Função RPC Corrigida para Confirmar Entrega
CREATE OR REPLACE FUNCTION rpc_confirmar_entrega(p_envio_id UUID, p_driver_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_solicitante_id UUID;
    v_fornecedor_solicitante_id UUID;
    v_fornecedor_driver_id UUID;
    v_saldo_solicitante INTEGER;
BEGIN
    -- 1. IDENTIFICAR solicitante e fornecedor do envio
    SELECT solicitante_id, fornecedor_id INTO v_solicitante_id, v_fornecedor_solicitante_id 
    FROM envios WHERE id = p_envio_id;

    -- Caso o solicitante_id esteja nulo, tenta via fornecedor (legado)
    IF v_solicitante_id IS NULL AND v_fornecedor_solicitante_id IS NOT NULL THEN
        SELECT id INTO v_solicitante_id FROM usuarios WHERE fornecedor_id = v_fornecedor_solicitante_id LIMIT 1;
    END IF;

    -- Se ainda assim não encontrar solicitante, erro
    IF v_solicitante_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Solicitante não identificado.');
    END IF;

    -- 2. VERIFICAR saldo do solicitante
    SELECT creditos, fornecedor_id INTO v_saldo_solicitante, v_fornecedor_solicitante_id 
    FROM usuarios WHERE id = v_solicitante_id;

    IF v_saldo_solicitante < 1 THEN
        RETURN json_build_object('success', false, 'message', 'O remetente não possui créditos MOVE suficientes.');
    END IF;

    -- 3. IDENTIFICAR fornecedor do motorista
    SELECT fornecedor_id INTO v_fornecedor_driver_id FROM usuarios WHERE id = p_driver_user_id;

    -- 4. TRANSAÇÃO DE CRÉDITOS
    -- A) Débito do solicitante
    UPDATE usuarios SET creditos = creditos - 1 WHERE id = v_solicitante_id;
    
    -- B) Crédito do entregador
    UPDATE usuarios SET creditos = creditos + 1 WHERE id = p_driver_user_id;

    -- C) Histórico Débito
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (v_solicitante_id, p_envio_id, 1, 'DEBITO', v_fornecedor_solicitante_id);

    -- D) Histórico Crédito
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (p_driver_user_id, p_envio_id, 1, 'CREDITO', v_fornecedor_driver_id);

    -- 5. FINALIZAR ENVIO
    UPDATE envios 
    SET status = 'entregue', 
        aceito_por = p_driver_user_id 
    WHERE id = p_envio_id;

    RETURN json_build_object('success', true, 'message', 'Entrega confirmada! 1 MOVE creditado.');
END;
$$ LANGUAGE plpgsql;
