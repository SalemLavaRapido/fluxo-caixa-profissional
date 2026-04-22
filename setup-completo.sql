-- SQL completo para configurar o Supabase para o Fluxo de Caixa Completo
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Criar tabela de entradas (estacionamento + lava rápido)
CREATE TABLE IF NOT EXISTS entradas (
    id BIGINT PRIMARY KEY DEFAULT (floor(random() * 1000000000)),
    servico TEXT NOT NULL CHECK (servico IN ('estacionamento', 'lava_rapido')),
    tipo_veiculo TEXT CHECK (tipo_veiculo IN ('carro', 'moto')),
    tipo_lavagem TEXT CHECK (tipo_lavagem IN ('simples', 'completo')),
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints para garantir consistência
    CONSTRAINT chk_estacionamento_veiculo CHECK (
        (servico = 'estacionamento' AND tipo_veiculo IS NOT NULL AND tipo_lavagem IS NULL) OR
        (servico = 'lava_rapido' AND tipo_veiculo IS NULL AND tipo_lavagem IS NOT NULL)
    )
);

-- 2. Criar tabela de despesas
CREATE TABLE IF NOT EXISTS despesas (
    id BIGINT PRIMARY KEY DEFAULT (floor(random() * 1000000000)),
    categoria TEXT NOT NULL CHECK (
        categoria IN (
            'funcionario_estacionamento', 
            'funcionario_lava', 
            'produto_lavagem', 
            'manutencao_box', 
            'energia', 
            'agua', 
            'aluguel', 
            'impostos', 
            'outros'
        )
    ),
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar Row Level Security (RLS) para segurança
ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas para permitir todas as operações (para uso simples)
CREATE POLICY "Allow all operations on entradas" ON entradas FOR ALL USING (true);
CREATE POLICY "Allow all operations on despesas" ON despesas FOR ALL USING (true);

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_entradas_data ON entradas(data);
CREATE INDEX IF NOT EXISTS idx_entradas_servico ON entradas(servico);
CREATE INDEX IF NOT EXISTS idx_entradas_tipo_veiculo ON entradas(tipo_veiculo);
CREATE INDEX IF NOT EXISTS idx_entradas_tipo_lavagem ON entradas(tipo_lavagem);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas(categoria);

-- 6. Inserir dados de exemplo (opcional)
INSERT INTO entradas (servico, tipo_veiculo, tipo_lavagem, valor, descricao, data) VALUES
('estacionamento', 'carro', NULL, 15.00, 'Carro normal - placa ABC1234', NOW()),
('estacionamento', 'moto', NULL, 10.00, 'Moto - placa XYZ999', NOW()),
('lava_rapido', NULL, 'simples', 25.00, 'Lava Simples - Gol', NOW()),
('lava_rapido', NULL, 'completo', 45.00, 'Lava Completo - Palio', NOW()),
('estacionamento', 'carro', NULL, 20.00, 'Carro mensalista - placa DEF5678', NOW()),
('lava_rapido', NULL, 'simples', 30.00, 'Lava Simples - Corsa', NOW());

INSERT INTO despesas (categoria, valor, descricao, data) VALUES
('funcionario_estacionamento', 1200.00, 'Salário funcionário estacionamento', NOW()),
('funcionario_lava', 1500.00, 'Salário funcionário lava rápido', NOW()),
('produto_lavagem', 200.00, 'Compra de shampoo e cera', NOW()),
('manutencao_box', 300.00, 'Manutenção box de lavagem', NOW()),
('energia', 250.00, 'Conta de luz - estacionamento', NOW()),
('agua', 80.00, 'Conta de água - estacionamento', NOW()),
('aluguel', 2000.00, 'Aluguel do imóvel', NOW()),
('impostos', 150.00, 'Impostos municipais', NOW()),
('outros', 50.00, 'Material de limpeza', NOW());

-- 7. Configurar timezone para Brasil
SET timezone = 'America/Sao_Paulo';

-- 8. Criar views para relatórios

-- View para resumo diário de entradas
CREATE OR REPLACE VIEW resumo_diario_entradas AS
SELECT 
    DATE_TRUNC('day', data) as dia,
    COUNT(*) as total_registros,
    COALESCE(SUM(CASE WHEN servico = 'estacionamento' AND tipo_veiculo = 'carro' THEN valor ELSE 0 END), 0) as estacionamento_carros,
    COALESCE(SUM(CASE WHEN servico = 'estacionamento' AND tipo_veiculo = 'moto' THEN valor ELSE 0 END), 0) as estacionamento_motos,
    COALESCE(SUM(CASE WHEN servico = 'lava_rapido' AND tipo_lavagem = 'simples' THEN valor ELSE 0 END), 0) as lava_simples,
    COALESCE(SUM(CASE WHEN servico = 'lava_rapido' AND tipo_lavagem = 'completo' THEN valor ELSE 0 END), 0) as lava_completo,
    COALESCE(SUM(valor), 0) as total_geral,
    COALESCE(AVG(valor), 0) as ticket_medio
FROM entradas
GROUP BY DATE_TRUNC('day', data)
ORDER BY dia DESC;

-- View para resumo diário de despesas
CREATE OR REPLACE VIEW resumo_diario_despesas AS
SELECT 
    DATE_TRUNC('day', data) as dia,
    COUNT(*) as total_despesas,
    COALESCE(SUM(valor), 0) as total_valor,
    categoria_principal
FROM (
    SELECT 
        data,
        valor,
        CASE 
            WHEN categoria IN ('funcionario_estacionamento', 'funcionario_lava') THEN 'funcionarios'
            WHEN categoria IN ('produto_lavagem', 'manutencao_box') THEN 'operacional'
            WHEN categoria IN ('energia', 'agua', 'aluguel') THEN 'fixo'
            WHEN categoria = 'impostos' THEN 'impostos'
            ELSE 'outros'
        END as categoria_principal
    FROM despesas
) sub
GROUP BY DATE_TRUNC('day', data), categoria_principal
ORDER BY dia DESC;

-- View para resumo mensal
CREATE OR REPLACE VIEW resumo_mensal AS
SELECT 
    DATE_TRUNC('month', data) as mes,
    COUNT(*) as total_registros,
    COALESCE(SUM(CASE WHEN servico = 'estacionamento' AND tipo_veiculo = 'carro' THEN valor ELSE 0 END), 0) as estacionamento_carros,
    COALESCE(SUM(CASE WHEN servico = 'estacionamento' AND tipo_veiculo = 'moto' THEN valor ELSE 0 END), 0) as estacionamento_motos,
    COALESCE(SUM(CASE WHEN servico = 'lava_rapido' AND tipo_lavagem = 'simples' THEN valor ELSE 0 END), 0) as lava_simples,
    COALESCE(SUM(CASE WHEN servico = 'lava_rapido' AND tipo_lavagem = 'completo' THEN valor ELSE 0 END), 0) as lava_completo,
    COALESCE(SUM(valor), 0) as total_geral
FROM entradas
GROUP BY DATE_TRUNC('month', data)
ORDER BY mes DESC;

-- 9. Criar função para limpar dados antigos (opcional)
CREATE OR REPLACE FUNCTION limpar_dados_antigos(dias INTEGER DEFAULT 30)
RETURNS void AS $$
BEGIN
    DELETE FROM entradas WHERE data < NOW() - INTERVAL '1 day' * dias;
    DELETE FROM despesas WHERE data < NOW() - INTERVAL '1 day' * dias;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar função para calcular métricas do dia
CREATE OR REPLACE FUNCTION metricas_dia(data_dia DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    total_carros INTEGER,
    total_motos INTEGER,
    total_lava_simples INTEGER,
    total_lava_completo INTEGER,
    faturamento_carros DECIMAL,
    faturamento_motos DECIMAL,
    faturamento_lava_simples DECIMAL,
    faturamento_lava_completo DECIMAL,
    total_entradas INTEGER,
    ticket_medio DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE servico = 'estacionamento' AND tipo_veiculo = 'carro')::INTEGER as total_carros,
        COUNT(*) FILTER (WHERE servico = 'estacionamento' AND tipo_veiculo = 'moto')::INTEGER as total_motos,
        COUNT(*) FILTER (WHERE servico = 'lava_rapido' AND tipo_lavagem = 'simples')::INTEGER as total_lava_simples,
        COUNT(*) FILTER (WHERE servico = 'lava_rapido' AND tipo_lavagem = 'completo')::INTEGER as total_lava_completo,
        COALESCE(SUM(CASE WHEN servico = 'estacionamento' AND tipo_veiculo = 'carro' THEN valor END), 0) as faturamento_carros,
        COALESCE(SUM(CASE WHEN servico = 'estacionamento' AND tipo_veiculo = 'moto' THEN valor END), 0) as faturamento_motos,
        COALESCE(SUM(CASE WHEN servico = 'lava_rapido' AND tipo_lavagem = 'simples' THEN valor END), 0) as faturamento_lava_simples,
        COALESCE(SUM(CASE WHEN servico = 'lava_rapido' AND tipo_lavagem = 'completo' THEN valor END), 0) as faturamento_lava_completo,
        COUNT(*)::INTEGER as total_entradas,
        COALESCE(AVG(valor), 0) as ticket_medio
    FROM entradas 
    WHERE DATE_TRUNC('day', data) = data_dia;
END;
$$ LANGUAGE plpgsql;

-- 11. Comentários para documentação
COMMENT ON TABLE entradas IS 'Registros de entradas do estacionamento e lava rápido';
COMMENT ON TABLE despesas IS 'Registros de despesas do negócio';
COMMENT ON COLUMN entradas.servico IS 'Tipo de serviço: estacionamento ou lava_rapido';
COMMENT ON COLUMN entradas.tipo_veiculo IS 'Tipo de veículo para estacionamento: carro ou moto';
COMMENT ON COLUMN entradas.tipo_lavagem IS 'Tipo de lavagem: simples ou completo';
COMMENT ON COLUMN entradas.valor IS 'Valor pago pelo serviço';
COMMENT ON COLUMN despesas.categoria IS 'Categoria da despesa com opções específicas para o negócio';

-- 12. Criar trigger para atualizar timestamps (opcional)
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data = COALESCE(NEW.data, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger se não existir
DROP TRIGGER IF EXISTS trigger_atualizar_entradas ON entradas;
CREATE TRIGGER trigger_atualizar_entradas
    BEFORE INSERT OR UPDATE ON entradas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

DROP TRIGGER IF EXISTS trigger_atualizar_despesas ON despesas;
CREATE TRIGGER trigger_atualizar_despesas
    BEFORE INSERT OR UPDATE ON despesas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- FIM DO SETUP COMPLETO
-- Agora seu Supabase está pronto para usar com o sistema completo de fluxo de caixa!
-- 
-- Para testar, execute:
-- SELECT * FROM metricas_dia();
-- SELECT * FROM resumo_diario_entradas;
-- SELECT * FROM resumo_mensal;
