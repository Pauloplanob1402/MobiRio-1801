
-- 1. Garante que a tabela 'usuarios' tenha a coluna 'creditos'
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 0;

-- 2. Garante que a tabela 'envios' tenha a coluna 'solicitante_id' para rastreio preciso de quem pediu a carona
ALTER TABLE IF EXISTS envios ADD COLUMN IF NOT EXISTS solicitante_id UUID REFERENCES auth.users(id);

-- 3. Garante que a tabela 'movimentos_credito' tenha a coluna 'usuario_id'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movimentos_credito' AND column_name='usuario_id') THEN
        ALTER TABLE movimentos_credito ADD COLUMN usuario_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 4. Função RPC Corrigida para Confirmar Entrega
-- Lógica: O SOLICITANTE perde 1 MOVE, o ENTREGADOR ganha 1 MOVE.
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

    -- Caso o solicitante_id esteja nulo (envios antigos), tenta buscar o primeiro usuário do fornecedor
    IF v_solicitante_id IS NULL THEN
        SELECT id INTO v_solicitante_id FROM usuarios WHERE fornecedor_id = v_fornecedor_solicitante_id LIMIT 1;
    END IF;

    -- 2. VERIFICAR saldo do solicitante (quem pediu a carona)
    SELECT creditos INTO v_saldo_solicitante FROM usuarios WHERE id = v_solicitante_id;

    IF v_solicitante_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Solicitante não identificado.');
    END IF;

    IF v_saldo_solicitante < 1 THEN
        RETURN json_build_object('success', false, 'message', 'Saldo MOVE insuficiente do solicitante.');
    END IF;

    -- 3. IDENTIFICAR fornecedor do motorista para o log
    SELECT fornecedor_id INTO v_fornecedor_driver_id FROM usuarios WHERE id = p_driver_user_id;

    -- 4. TRANSAÇÃO (Débito do Solicitante / Crédito do Entregador)
    
    -- A) Diminuir 1 crédito do solicitante
    UPDATE usuarios SET creditos = creditos - 1 WHERE id = v_solicitante_id;
    
    -- B) Aumentar 1 crédito do entregador
    UPDATE usuarios SET creditos = creditos + 1 WHERE id = p_driver_user_id;

    -- C) Registrar Histórico de DÉBITO (-1)
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (v_solicitante_id, p_envio_id, 1, 'DEBITO', v_fornecedor_solicitante_id);

    -- D) Registrar Histórico de CRÉDITO (+1)
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (p_driver_user_id, p_envio_id, 1, 'CREDITO', v_fornecedor_driver_id);

    -- 5. ATUALIZAR status do envio
    UPDATE envios 
    SET status = 'entregue', 
        aceito_por = p_driver_user_id 
    WHERE id = p_envio_id;

    RETURN json_build_object('success', true, 'message', 'Entrega confirmada! Você ganhou 1 MOVE');
END;
$$ LANGUAGE plpgsql;
