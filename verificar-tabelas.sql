-- Script para verificar e corrigir tabelas
-- Execute isso no SQL Editor do Supabase

-- 1. Verificar se as tabelas existem
SELECT 'Tabela entradas existe' as status, 
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entradas') THEN 'SIM'
           ELSE 'NÃO'
       END as resultado;

SELECT 'Tabela saidas existe' as status,
       CASE
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saidas') THEN 'SIM'
           ELSE 'NÃO'
       END as resultado;

-- 2. Verificar estrutura das tabelas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'entradas' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'saidas' 
ORDER BY ordinal_position;

-- 3. Verificar se há dados
SELECT COUNT(*) as total_entradas FROM entradas;
SELECT COUNT(*) as total_saidas FROM saidas;

-- 4. Testar inserção simples
INSERT INTO entradas (user_id, data, descricao, categoria, valor)
VALUES (
    'test-user-id',
    CURRENT_DATE,
    'Teste de verificação',
    'vendas',
    100.00
);

INSERT INTO saidas (user_id, data, descricao, categoria, tipo, valor)
VALUES (
    'test-user-id',
    CURRENT_DATE,
    'Teste de verificação',
    'aluguel',
    'fixo',
    50.00
);

-- 5. Limpar dados de teste (opcional)
-- DELETE FROM entradas WHERE descricao = 'Teste de verificação';
-- DELETE FROM saidas WHERE descricao = 'Teste de verificação';

SELECT 'Verificação concluída' as status;
