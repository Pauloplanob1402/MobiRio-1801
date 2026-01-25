
-- 1. Garante que a tabela 'usuarios' tenha a coluna 'creditos' para cache de saldo
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 0;

-- 2. Garante que a tabela 'movimentos_credito' tenha a coluna 'usuario_id' para rastreamento individual
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movimentos_credito' AND column_name='usuario_id') THEN
        ALTER TABLE movimentos_credito ADD COLUMN usuario_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Função de Gatilho (Trigger) para Atualização Automática de Saldo
-- Esta função garante que qualquer INSERT na tabela 'movimentos_credito' 
-- reflita instantaneamente na coluna 'creditos' da tabela 'usuarios'.
-- Isso permite que o app leia o saldo rapidamente sem precisar somar todo o histórico.
CREATE OR REPLACE FUNCTION fn_atualizar_saldo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.tipo = 'CREDITO') THEN
        UPDATE usuarios 
        SET creditos = creditos + NEW.quantidade 
        WHERE id = NEW.usuario_id;
    ELSIF (NEW.tipo = 'DEBITO') THEN
        UPDATE usuarios 
        SET creditos = creditos - NEW.quantidade 
        WHERE id = NEW.usuario_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Aplicação do Gatilho
DROP TRIGGER IF EXISTS trg_atualizar_saldo ON movimentos_credito;
CREATE TRIGGER trg_atualizar_saldo
AFTER INSERT ON movimentos_credito
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_saldo_usuario();

-- 5. Comentário de segurança
-- A partir de agora, o sistema é "Ledger-Based": 
-- Você insere o movimento, e o banco cuida do saldo.
