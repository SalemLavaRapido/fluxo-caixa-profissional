-- Script completo para verificar e corrigir tabelas
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

-- 2. Verificar estrutura completa das tabelas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('entradas', 'saidas')
ORDER BY table_name, ordinal_position;

-- 3. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('entradas', 'saidas')
ORDER BY tablename, policyname;

-- 4. Verificar RLS status
SELECT tablename, rowsecurity, forcerls 
FROM pg_tables 
WHERE tablename IN ('entradas', 'saidas');

-- 5. Contar dados existentes
SELECT COUNT(*) as total_entradas FROM entradas;
SELECT COUNT(*) as total_saidas FROM saidas;

-- 6. Verificar dados de exemplo (se houver)
SELECT * FROM entradas LIMIT 5;
SELECT * FROM saidas LIMIT 5;

-- 7. Limpar dados de teste (se existirem)
DELETE FROM entradas WHERE descricao LIKE 'Teste%';
DELETE FROM saidas WHERE descricao LIKE 'Teste%';

-- 8. Recriar tabelas se necessário (COM CUIDADO!)
-- DROP TABLE IF EXISTS entradas CASCADE;
-- DROP TABLE IF EXISTS saidas CASCADE;

-- 9. Criar tabelas do zero (se necessário)
-- CREATE TABLE entradas (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--     data DATE NOT NULL,
--     descricao TEXT NOT NULL,
--     categoria TEXT NOT NULL,
--     valor DECIMAL(10,2) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- CREATE TABLE saidas (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--     data DATE NOT NULL,
--     descricao TEXT NOT NULL,
--     categoria TEXT NOT NULL,
--     tipo TEXT NOT NULL,
--     valor DECIMAL(10,2) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 10. Habilitar RLS
-- ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saidas ENABLE ROW LEVEL SECURITY;

-- 11. Criar políticas simples
-- CREATE POLICY "Enable all for entradas" ON entradas FOR ALL USING (true);
-- CREATE POLICY "Enable all for saidas" ON saidas FOR ALL USING (true);

-- 12. Status final
SELECT 'Verificação concluída' as status;
