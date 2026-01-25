
-- 1. Garante que a tabela 'usuarios' tenha a coluna 'creditos'
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 0;

-- 2. Adiciona colunas fiscais e de localização na tabela 'usuarios'
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS endereco TEXT;

-- 3. Garante que a tabela 'envios' tenha a coluna 'solicitante_id'
ALTER TABLE IF EXISTS envios ADD COLUMN IF NOT EXISTS solicitante_id UUID REFERENCES auth.users(id);

-- 4. Função RPC Definitiva para Confirmar Entrega
CREATE OR REPLACE FUNCTION rpc_confirmar_entrega(p_envio_id UUID, p_driver_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_solicitante_id UUID;
    v_fornecedor_solicitante_id UUID;
    v_fornecedor_driver_id UUID;
    v_saldo_solicitante INTEGER;
BEGIN
    -- 1. IDENTIFICAR solicitante e seu saldo atual
    SELECT solicitante_id, fornecedor_id INTO v_solicitante_id, v_fornecedor_solicitante_id 
    FROM envios WHERE id = p_envio_id;

    -- Fallback para envios antigos sem solicitante_id direto
    IF v_solicitante_id IS NULL AND v_fornecedor_solicitante_id IS NOT NULL THEN
        SELECT id INTO v_solicitante_id FROM usuarios WHERE fornecedor_id = v_fornecedor_solicitante_id LIMIT 1;
    END IF;

    IF v_solicitante_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Erro: Solicitante não identificado.');
    END IF;

    -- 2. VERIFICAR SALDO DO SOLICITANTE
    SELECT creditos INTO v_saldo_solicitante FROM usuarios WHERE id = v_solicitante_id;

    IF v_saldo_solicitante < 1 THEN
        RETURN json_build_object('success', false, 'message', 'O remetente da carga não possui saldo MOVE suficiente para completar a transação.');
    END IF;

    -- 3. IDENTIFICAR fornecedor do motorista para logs
    SELECT fornecedor_id INTO v_fornecedor_driver_id FROM usuarios WHERE id = p_driver_user_id;

    -- 4. PROCESSAR TRANSAÇÃO ATÔMICA
    -- A) Debitar solicitante
    UPDATE usuarios SET creditos = creditos - 1 WHERE id = v_solicitante_id;
    
    -- B) Creditar entregador
    UPDATE usuarios SET creditos = creditos + 1 WHERE id = p_driver_user_id;

    -- C) Histórico Débito (Solicitante)
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (v_solicitante_id, p_envio_id, 1, 'DEBITO', v_fornecedor_solicitante_id);

    -- D) Histórico Crédito (Entregador)
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo, fornecedor_id)
    VALUES (p_driver_user_id, p_envio_id, 1, 'CREDITO', v_fornecedor_driver_id);

    -- 5. FINALIZAR ENVIO
    UPDATE envios 
    SET status = 'entregue', 
        aceito_por = p_driver_user_id 
    WHERE id = p_envio_id;

    RETURN json_build_object('success', true, 'message', 'Entrega confirmada com sucesso! Você ganhou 1 MOVE.');
END;
$$ LANGUAGE plpgsql;
