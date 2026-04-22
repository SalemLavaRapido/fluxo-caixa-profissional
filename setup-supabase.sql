-- Script SQL para configurar o Supabase para o Fluxo de Caixa Profissional
-- Execute este script no SQL Editor do seu projeto Supabase

-- =====================================================
-- 1. CRIAR TABELAS
-- =====================================================

-- Tabela de entradas (receitas)
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

-- Tabela de saídas (despesas)
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

-- =====================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE saidas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CRIAR POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Políticas para entradas
CREATE POLICY "Users can view own entradas" ON entradas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entradas" ON entradas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entradas" ON entradas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entradas" ON entradas
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para saídas
CREATE POLICY "Users can view own saidas" ON saidas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saidas" ON saidas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saidas" ON saidas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saidas" ON saidas
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para entradas
CREATE INDEX IF NOT EXISTS idx_entradas_user_id ON entradas(user_id);
CREATE INDEX IF NOT EXISTS idx_entradas_data ON entradas(data);
CREATE INDEX IF NOT EXISTS idx_entradas_categoria ON entradas(categoria);
CREATE INDEX IF NOT EXISTS idx_entradas_created_at ON entradas(created_at);

-- Índices para saídas
CREATE INDEX IF NOT EXISTS idx_saidas_user_id ON saidas(user_id);
CREATE INDEX IF NOT EXISTS idx_saidas_data ON saidas(data);
CREATE INDEX IF NOT EXISTS idx_saidas_categoria ON saidas(categoria);
CREATE INDEX IF NOT EXISTS idx_saidas_tipo ON saidas(tipo);
CREATE INDEX IF NOT EXISTS idx_saidas_created_at ON saidas(created_at);

-- =====================================================
-- 5. CRIAR TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para entradas
CREATE TRIGGER update_entradas_updated_at
    BEFORE UPDATE ON entradas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para saídas
CREATE TRIGGER update_saidas_updated_at
    BEFORE UPDATE ON saidas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. CRIAR VIEWS ÚTEIS
-- =====================================================

-- View de resumo mensal
CREATE OR REPLACE VIEW resumo_mensal AS
SELECT 
    user_id,
    DATE_TRUNC('month', data) as mes,
    COUNT(*) FILTER (WHERE true) as total_transacoes,
    COUNT(*) FILTER (WHERE true) as total_entradas,
    COALESCE(SUM(CASE WHEN true THEN valor END), 0) as total_entradas_valor,
    0 as total_saidas,
    0 as total_saidas_valor
FROM entradas
GROUP BY user_id, DATE_TRUNC('month', data)

UNION ALL

SELECT 
    user_id,
    DATE_TRUNC('month', data) as mes,
    COUNT(*) FILTER (WHERE true) as total_transacoes,
    0 as total_entradas,
    0 as total_entradas_valor,
    COUNT(*) FILTER (WHERE true) as total_saidas,
    COALESCE(SUM(valor), 0) as total_saidas_valor
FROM saidas
GROUP BY user_id, DATE_TRUNC('month', data);

-- View de resumo por categoria
CREATE OR REPLACE VIEW resumo_categorias AS
SELECT 
    user_id,
    'entrada' as tipo,
    categoria,
    COUNT(*) as quantidade,
    COALESCE(SUM(valor), 0) as total_valor
FROM entradas
GROUP BY user_id, categoria

UNION ALL

SELECT 
    user_id,
    'saida' as tipo,
    categoria,
    COUNT(*) as quantidade,
    COALESCE(SUM(valor), 0) as total_valor
FROM saidas
GROUP BY user_id, categoria;

-- =====================================================
-- 7. INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Dados exemplo serão inseridos quando um usuário se cadastrar
-- através da aplicação

-- =====================================================
-- 8. CONFIGURAR TIMEZONE
-- =====================================================

SET timezone = 'America/Sao_Paulo';

-- =====================================================
-- 9. COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE entradas IS 'Tabela de entradas/receitas do fluxo de caixa';
COMMENT ON TABLE saidas IS 'Tabela de saídas/despesas do fluxo de caixa';

COMMENT ON COLUMN entradas.user_id IS 'ID do usuário dono do registro';
COMMENT ON COLUMN entradas.data IS 'Data da transação';
COMMENT ON COLUMN entradas.descricao IS 'Descrição detalhada da entrada';
COMMENT ON COLUMN entradas.categoria IS 'Categoria da entrada (vendas, servicos, etc.)';
COMMENT ON COLUMN entradas.valor IS 'Valor da entrada';

COMMENT ON COLUMN saidas.user_id IS 'ID do usuário dono do registro';
COMMENT ON COLUMN saidas.data IS 'Data da transação';
COMMENT ON COLUMN saidas.descricao IS 'Descrição detalhada da saída';
COMMENT ON COLUMN saidas.categoria IS 'Categoria da saída (aluguel, funcionarios, etc.)';
COMMENT ON COLUMN saidas.tipo IS 'Tipo da saída (fixo ou variavel)';
COMMENT ON COLUMN saidas.valor IS 'Valor da saída';

-- =====================================================
-- 10. FUNÇÕES ÚTEIS
-- =====================================================

-- Função para calcular saldo do usuário
CREATE OR REPLACE FUNCTION calcular_saldo_usuario(p_user_id UUID, p_data_inicio DATE DEFAULT NULL, p_data_fim DATE DEFAULT NULL)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total_entradas DECIMAL(10,2);
    v_total_saidas DECIMAL(10,2);
BEGIN
    -- Calcular total de entradas
    SELECT COALESCE(SUM(valor), 0) INTO v_total_entradas
    FROM entradas
    WHERE user_id = p_user_id
    AND (p_data_inicio IS NULL OR data >= p_data_inicio)
    AND (p_data_fim IS NULL OR data <= p_data_fim);
    
    -- Calcular total de saídas
    SELECT COALESCE(SUM(valor), 0) INTO v_total_saidas
    FROM saidas
    WHERE user_id = p_user_id
    AND (p_data_inicio IS NULL OR data >= p_data_inicio)
    AND (p_data_fim IS NULL OR data <= p_data_fim);
    
    RETURN v_total_entradas - v_total_saidas;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIM DO SETUP
-- =====================================================

-- Execute este script completamente antes de usar a aplicação
-- Certifique-se de que todas as tabelas, índices e políticas foram criadas com sucesso
