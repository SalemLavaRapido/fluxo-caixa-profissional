-- Versão mínima para teste
-- Execute isso primeiro

-- Tabela simples de entradas
CREATE TABLE entradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    data DATE,
    descricao TEXT,
    categoria TEXT,
    valor DECIMAL
);

-- Tabela simples de saídas  
CREATE TABLE saidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    data DATE,
    descricao TEXT,
    categoria TEXT,
    tipo TEXT,
    valor DECIMAL
);
