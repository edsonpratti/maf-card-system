-- Script para corrigir metadata do usuário admin
-- Execute este script no SQL Editor do Supabase se o login do admin não estiver funcionando

-- OPÇÃO 1: Se você sabe o email do admin
-- Substitua 'admin@maf.com' pelo email correto
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
WHERE email = 'admin@maf.com'; -- ⚠️ ALTERE ESTE EMAIL

-- OPÇÃO 2: Se você sabe o UUID do admin
-- Substitua 'UUID_DO_ADMIN' pelo UUID correto
-- UPDATE auth.users 
-- SET 
--   raw_app_meta_data = jsonb_set(
--     COALESCE(raw_app_meta_data, '{}'::jsonb),
--     '{is_admin}',
--     'true'::jsonb
--   ),
--   raw_user_meta_data = jsonb_set(
--     COALESCE(raw_user_meta_data, '{}'::jsonb),
--     '{is_admin}',
--     'true'::jsonb
--   )
-- WHERE id = 'UUID_DO_ADMIN'::uuid;

-- Verificar se foi atualizado corretamente
SELECT 
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE email = 'admin@maf.com' -- ⚠️ ALTERE ESTE EMAIL
  OR raw_app_meta_data->>'is_admin' = 'true'
  OR raw_user_meta_data->>'is_admin' = 'true';
