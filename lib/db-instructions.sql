
-- 1. Garante que a tabela 'usuarios' tenha as colunas necessárias
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 12;
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS telefone TEXT;

-- 2. Garante que a tabela 'fornecedores' tenha as colunas necessárias
ALTER TABLE IF EXISTS fornecedores ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 12;
ALTER TABLE IF EXISTS fornecedores ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE IF EXISTS fornecedores ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- 3. Garante que a tabela 'envios' tenha a coluna 'solicitante_id'
ALTER TABLE IF EXISTS envios ADD COLUMN IF NOT EXISTS solicitante_id UUID REFERENCES auth.users(id);

-- 4. Função RPC Definitiva para Confirmar Entrega
-- Transfere 1 MOVE do Solicitante para o Entregador
CREATE OR REPLACE FUNCTION rpc_confirmar_entrega(p_envio_id UUID, p_driver_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_solicitante_id UUID;
    v_saldo_solicitante INTEGER;
BEGIN
    -- 1. Identificar o solicitante do envio
    SELECT solicitante_id INTO v_solicitante_id FROM envios WHERE id = p_envio_id;

    IF v_solicitante_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Erro: Solicitante não identificado.');
    END IF;

    -- 2. Verificar saldo do solicitante na tabela 'usuarios'
    SELECT creditos INTO v_saldo_solicitante FROM usuarios WHERE id = v_solicitante_id;

    IF v_saldo_solicitante < 1 THEN
        RETURN json_build_object('success', false, 'message', 'O remetente não possui créditos MOVE suficientes.');
    END IF;

    -- 3. Processar Transação (Foco exclusivo na tabela usuarios)
    -- Debitar Solicitante
    UPDATE usuarios SET creditos = creditos - 1 WHERE id = v_solicitante_id;
    -- Creditar Entregador
    UPDATE usuarios SET creditos = creditos + 1 WHERE id = p_driver_user_id;
    
    -- Sincronizar com tabela fornecedores apenas se o registro existir (opcional)
    UPDATE fornecedores f SET creditos = u.creditos FROM usuarios u WHERE f.id = u.id AND u.id IN (v_solicitante_id, p_driver_user_id);

    -- Registrar Movimentos no Histórico
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo)
    VALUES (v_solicitante_id, p_envio_id, 1, 'DEBITO');
    
    INSERT INTO movimentos_credito (usuario_id, envio_id, quantidade, tipo)
    VALUES (p_driver_user_id, p_envio_id, 1, 'CREDITO');

    -- 4. Finalizar Envio
    UPDATE envios SET status = 'entregue' WHERE id = p_envio_id;

    RETURN json_build_object('success', true, 'message', 'Entrega concluída! +1 MOVE creditado.');
END;
$$ LANGUAGE plpgsql;
