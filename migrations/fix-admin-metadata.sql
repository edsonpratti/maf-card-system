-- ============================================================================
-- Script para corrigir metadata do usuário admin
-- ============================================================================
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- Acesse: Dashboard → SQL Editor → New Query → Cole e Execute

-- PASSO 1: Primeiro, veja todos os usuários para identificar o email do admin
SELECT 
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- PASSO 2: Identifique o email do admin na lista acima e substitua abaixo
-- OPÇÃO 1: Se você sabe o email do admin
-- Substitua 'admin@maf.com' pelo email correto que você viu no PASSO 1
UPDATE auth.users 
SET 
  raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{is_admin}',
    'true'::jsonb
  ),
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_admin}',
    'true'::jsonb
  )
WHERE email = 'edson@edsonpratti.com.br'; -- ⚠️ ALTERE ESTE EMAIL PARA O SEU ADMIN

-- PASSO 3: Verifique se foi atualizado corretamente
-- Deve retornar o usuário com is_admin: true nos metadados
SELECT 
  id,
  email,
  raw_app_meta_data->>'is_admin' as app_is_admin,
  raw_user_meta_data->>'is_admin' as user_is_admin,
  created_at
FROM auth.users
WHERE email = 'edson@edsonpratti.com.br'; -- ⚠️ USE O MESMO EMAIL DO PASSO 2

-- ============================================================================
-- INSTRUÇÕES:
-- ============================================================================
-- 1. Execute o PASSO 1 para ver todos os usuários
-- 2. Identifique o email do admin
-- 3. Substitua 'edson@edsonpratti.com.br' pelo email correto nos PASSOs 2 e 3
-- 4. Execute o PASSO 2 (UPDATE)
-- 5. Execute o PASSO 3 (SELECT) para confirmar
-- 6. Faça logout e login novamente no sistema
-- ============================================================================
