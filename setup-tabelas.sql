-- Apenas criar tabelas - execute isso primeiro
-- Tabela de entradas
CREATE TABLE IF NOT EXISTS entradas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('vendas', 'servicos', 'aluguel', 'investimentos', 'outras')),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de saídas
CREATE TABLE IF NOT EXISTS saidas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('aluguel', 'funcionarios', 'fornecedores', 'impostos', 'marketing', 'transporte', 'outras')),
    tipo TEXT NOT NULL CHECK (tipo IN ('fixo', 'variavel')),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
