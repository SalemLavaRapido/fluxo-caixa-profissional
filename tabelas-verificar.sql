-- Script completo para verificar tabelas no Supabase
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

-- 6. Mostrar dados de exemplo (se houver)
SELECT * FROM entradas LIMIT 5;
SELECT * FROM saidas LIMIT 5;

-- 7. Status final
SELECT 'Verificação concluída' as status;
