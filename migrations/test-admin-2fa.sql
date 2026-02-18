-- Script de teste para o sistema 2FA
-- Execute no Supabase SQL Editor para testar o sistema

-- 1. Verificar se a tabela foi criada corretamente
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_2fa_codes'
ORDER BY ordinal_position;

-- 2. Verificar índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'admin_2fa_codes';

-- 3. Verificar políticas RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'admin_2fa_codes';

-- 4. Simular inserção de código (apenas para teste)
-- ATENÇÃO: Use apenas em ambiente de desenvolvimento
/*
INSERT INTO admin_2fa_codes (email, code, expires_at)
VALUES (
    'admin@teste.com',
    '123456',
    NOW() + INTERVAL '10 minutes'
);
*/

-- 5. Consultar códigos gerados (últimos 10)
SELECT 
    id,
    email,
    code,
    created_at,
    expires_at,
    used,
    used_at,
    CASE 
        WHEN used THEN 'Usado'
        WHEN expires_at < NOW() THEN 'Expirado'
        ELSE 'Válido'
    END as status,
    EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutos_restantes
FROM admin_2fa_codes
ORDER BY created_at DESC
LIMIT 10;

-- 6. Estatísticas de uso
SELECT 
    COUNT(*) as total_codigos,
    COUNT(CASE WHEN used THEN 1 END) as codigos_usados,
    COUNT(CASE WHEN NOT used AND expires_at > NOW() THEN 1 END) as codigos_validos,
    COUNT(CASE WHEN NOT used AND expires_at < NOW() THEN 1 END) as codigos_expirados,
    AVG(EXTRACT(EPOCH FROM (used_at - created_at))/60) as tempo_medio_uso_minutos
FROM admin_2fa_codes;

-- 7. Códigos por email
SELECT 
    email,
    COUNT(*) as total_tentativas,
    COUNT(CASE WHEN used THEN 1 END) as tentativas_sucesso,
    MAX(created_at) as ultima_tentativa
FROM admin_2fa_codes
GROUP BY email
ORDER BY total_tentativas DESC;

-- 8. Limpar códigos expirados (execute manualmente quando necessário)
-- SELECT clean_expired_2fa_codes();

-- 9. Remover TODOS os códigos (apenas para testes/reset)
-- CUIDADO: Isso apaga todos os dados da tabela
-- DELETE FROM admin_2fa_codes;
