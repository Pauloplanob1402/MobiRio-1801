
-- 1. Garante que a tabela 'usuarios' tenha a coluna 'creditos'
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 0;

-- 2. Garante que a tabela 'movimentos_credito' tenha a coluna 'usuario_id'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movimentos_credito' AND column_name='usuario_id') THEN
        ALTER TABLE movimentos_credito ADD COLUMN usuario_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Função RPC Definitiva para Confirmar Entrega e Mover Créditos
CREATE OR REPLACE FUNCTION rpc_confirmar_entrega(p_envio_id UUID, p_driver_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_solicitante_id UUID;
    v_fornecedor_solicitante_id UUID;
    v_fornecedor_driver_id UUID;
    v_saldo_solicitante INTEGER;
    v_envio_descricao TEXT;
BEGIN
    -- Obter dados do envio
    SELECT fornecedor_id, descricao INTO v_fornecedor_solicitante_id, v_envio_descricao 
    FROM envios WHERE id = p_envio_id;

    -- Localizar o usuário 'solicitante' (dono do fornecedor que pediu a carona)
    SELECT id, creditos INTO v_solicitante_id, v_saldo_solicitante
    FROM usuarios 
    WHERE fornecedor_id = v_fornecedor_solicitante_id
    LIMIT 1;

    -- Obter fornecedor do motorista para o log
    SELECT fornecedor_id INTO v_fornecedor_driver_id FROM usuarios WHERE id = p_driver_user_id;

    -- Validações
    IF v_solicitante_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Solicitante não encontrado.');
    END IF;

    IF v_saldo_solicitante < 1 THEN
        RETURN json_build_object('success', false, 'message', 'O remetente não possui saldo MOVE suficiente.');
    END IF;

    -- INÍCIO DA TRANSAÇÃO DE CRÉDITOS
    
    -- 1. Debitar do solicitante
    UPDATE usuarios SET creditos = creditos - 1 WHERE id = v_solicitante_id;
    
    -- 2. Creditar ao entregador (logado)
    UPDATE usuarios SET creditos = creditos + 1 WHERE id = p_driver_user_id;

    -- 3. Registrar Histórico de Débito
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (v_solicitante_id, p_envio_id, 1, 'DEBITO', v_fornecedor_solicitante_id);

    -- 4. Registrar Histórico de Crédito
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (p_driver_user_id, p_envio_id, 1, 'CREDITO', v_fornecedor_driver_id);

    -- 5. Finalizar o Envio
    UPDATE envios SET status = 'entregue', aceito_por = p_driver_user_id WHERE id = p_envio_id;

    RETURN json_build_object('success', true, 'message', 'Entrega confirmada! 1 MOVE transferido para sua carteira.');
END;
$$ LANGUAGE plpgsql;
