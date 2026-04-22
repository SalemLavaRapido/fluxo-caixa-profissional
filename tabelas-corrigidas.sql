-- Script corrigido para PostgreSQL
-- Execute isso no SQL Editor do Supabase

-- 1. Verificar se as tabelas existem (sintaxe corrigida)
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'entradas'
) AS tabela_entradas_existe;

SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'saidas'
) AS tabela_saidas_existe;

-- 2. Verificar estrutura das tabelas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('entradas', 'saidas')
ORDER BY table_name, ordinal_position;

-- 3. Verificar RLS
SELECT tablename, rowsecurity, forcerls 
FROM pg_tables 
WHERE tablename IN ('entradas', 'saidas');

-- 4. Verificar dados existentes
SELECT COUNT(*) AS total_entradas FROM entradas;
SELECT COUNT(*) AS total_saidas FROM saidas;

-- 5. Status final
SELECT 
    'Tabelas verificadas' AS status,
    CASE 
        WHEN tabela_entradas_existe = true AND tabela_saidas_existe = true THEN 'COMPLETO'
        ELSE 'INCOMPLETO'
    END;

-- 6. Limpar dados de teste (se existirem)
DELETE FROM entradas WHERE descricao LIKE 'Teste%';
DELETE FROM saidas WHERE descricao LIKE 'Teste%';
