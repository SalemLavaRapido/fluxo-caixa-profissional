-- Script simples para verificar tabelas no Supabase
-- Execute isso no SQL Editor do Supabase

-- 1. Verificar se as tabelas existem
SELECT 
    'entradas' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entradas') THEN 'SIM'
        ELSE 'NÃO'
    END as existe
UNION ALL
SELECT 
    'saidas' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saidas') THEN 'SIM'
        ELSE 'NÃO'
    END as existe;

-- 2. Verificar estrutura das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('entradas', 'saidas')
ORDER BY table_name, ordinal_position;

-- 3. Contar dados
SELECT COUNT(*) as total FROM entradas;
SELECT COUNT(*) as total FROM saidas;

-- 4. Mostrar dados exemplo
SELECT * FROM entradas LIMIT 3;
SELECT * FROM saidas LIMIT 3;
