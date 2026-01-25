
-- 1. Garante que a tabela 'usuarios' tenha a coluna 'creditos'
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 0;

-- 2. Ajusta a tabela 'movimentos_credito' para usar 'usuario_id' se necessário
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movimentos_credito' AND column_name='usuario_id') THEN
        ALTER TABLE movimentos_credito ADD COLUMN usuario_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Função Transacional RPC para Confirmar Entrega e Transferir Créditos
-- Esta função é o motor do sistema de créditos MOVE.
CREATE OR REPLACE FUNCTION rpc_confirmar_entrega(p_envio_id UUID, p_driver_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_requester_user_id UUID;
    v_current_credits INTEGER;
    v_fornecedor_id UUID;
    v_driver_fornecedor_id UUID;
BEGIN
    -- Obter o ID do fornecedor do envio (quem solicitou)
    SELECT fornecedor_id INTO v_fornecedor_id FROM envios WHERE id = p_envio_id;

    -- Localizar o usuário dono desse fornecedor (solicitante) na tabela usuarios
    -- Usamos o saldo da tabela usuarios como fonte da verdade.
    SELECT id, creditos INTO v_requester_user_id, v_current_credits
    FROM usuarios 
    WHERE fornecedor_id = v_fornecedor_id
    LIMIT 1;

    -- Obter o fornecedor_id do motorista para o histórico
    SELECT fornecedor_id INTO v_driver_fornecedor_id FROM usuarios WHERE id = p_driver_user_id;

    -- Validação de existência do solicitante
    IF v_requester_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Solicitante não encontrado para este envio.');
    END IF;

    -- Validação de saldo do solicitante (Verificação universal na tabela usuarios)
    IF v_current_credits < 1 THEN
        RETURN json_build_object('success', false, 'message', 'Saldo MOVE insuficiente do remetente.');
    END IF;

    -- INÍCIO DA TRANSAÇÃO ATÔMICA
    
    -- 1. Deduzir 1 crédito do solicitante (Remetente)
    UPDATE usuarios SET creditos = creditos - 1 WHERE id = v_requester_user_id;
    
    -- 2. Adicionar 1 crédito ao motorista (Entregador logado)
    UPDATE usuarios SET creditos = creditos + 1 WHERE id = p_driver_user_id;

    -- 3. Atualizar status do envio para entregue
    UPDATE envios SET status = 'entregue' WHERE id = p_envio_id;

    -- 4. Registrar movimento de DÉBITO no histórico (Remetente)
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (v_requester_user_id, p_envio_id, 1, 'DEBITO', v_fornecedor_id);

    -- 5. Registrar movimento de CRÉDITO no histórico (Entregador)
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (p_driver_user_id, p_envio_id, 1, 'CREDITO', v_driver_fornecedor_id);

    RETURN json_build_object('success', true, 'message', 'Entrega confirmada com sucesso! 1 MOVE transferido.');
END;
$$ LANGUAGE plpgsql;
