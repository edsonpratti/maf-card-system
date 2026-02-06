-- Script para criar usuário admin inicial no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- ⚠️ IMPORTANTE: Execute PRIMEIRO o arquivo schema.sql antes deste script!
-- O schema.sql cria as tabelas necessárias (students_base, users_cards, admin_audit_logs)

-- PASSO 0: Verificar se as tabelas existem
-- Execute este comando para verificar:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Deve retornar: students_base, users_cards, admin_audit_logs

-- ==============================================================================
-- PASSO 1: Criar o usuário de autenticação
-- ==============================================================================
-- ATENÇÃO: Substitua 'admin@maf.com' e 'senha-forte-aqui' pelos valores desejados
-- Execute este comando no SQL Editor do Supabase:

/*
-- Criar o usuário admin na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@maf.com', -- ALTERE ESTE EMAIL
  crypt('SenhaForte123!@#', gen_salt('bf')), -- ALTERE ESTA SENHA
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"],"is_admin":true}',
  '{"name":"Administrador MAF","is_admin":true}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
*/

-- ALTERNATIVA MAIS SIMPLES E RECOMENDADA:
-- Use o Dashboard do Supabase para criar o usuário admin:
-- 1. Vá em Authentication > Users
-- 2. Clique em "Add User"
-- 3. Escolha "Create new user"
-- 4. Preencha:
--    - Email: admin@maf.com (ou o email desejado)
--    - Password: (escolha uma senha forte)
--    - Auto Confirm User: ✓ (marcar)
-- 5. Clique em "Create User"

-- Passo 2: Adicionar metadata de admin ao usuário criado
-- Substitua 'UUID_DO_USUARIO_ADMIN' pelo UUID gerado
-- Você pode encontrar o UUID em Authentication > Users

-- UPDATE auth.users 
-- SET raw_app_meta_data = jsonb_set(
--   COALESCE(raw_app_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'::jsonb
-- ),
-- raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'::jsonb
-- )
-- WHERE email = 'admin@maf.com'; -- Use o email do admin criado

-- ==============================================================================
-- PASSO 2: Criar uma função helper para verificar se o usuário é admin
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- PASSO 3: Atualizar políticas RLS para permitir acesso admin
-- ==============================================================================

-- Remover políticas existentes se houver (para evitar conflitos)
DROP POLICY IF EXISTS "Admins podem ver todos os logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins podem inserir logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins podem ver toda base de estudantes" ON public.students_base;
DROP POLICY IF EXISTS "Admins podem inserir estudantes" ON public.students_base;
DROP POLICY IF EXISTS "Admins podem atualizar estudantes" ON public.students_base;
DROP POLICY IF EXISTS "Admins podem deletar estudantes" ON public.students_base;
DROP POLICY IF EXISTS "Admins podem ver todos os cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Admins podem inserir cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Admins podem atualizar cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Admins podem deletar cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Qualquer um pode validar cartão via token" ON public.users_cards;

-- Policy para admin_audit_logs
CREATE POLICY "Admins podem ver todos os logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins podem inserir logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy para students_base
CREATE POLICY "Admins podem ver toda base de estudantes"
  ON public.students_base
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins podem inserir estudantes"
  ON public.students_base
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins podem atualizar estudantes"
  ON public.students_base
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins podem deletar estudantes"
  ON public.students_base
  FOR DELETE
  USING (public.is_admin());

-- Policy para users_cards
CREATE POLICY "Admins podem ver todos os cartões"
  ON public.users_cards
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins podem inserir cartões"
  ON public.users_cards
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins podem atualizar cartões"
  ON public.users_cards
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins podem deletar cartões"
  ON public.users_cards
  FOR DELETE
  USING (public.is_admin());

-- Policy para leitura pública de cartões validados (via token)
CREATE POLICY "Qualquer um pode validar cartão via token"
  ON public.users_cards
  FOR SELECT
  USING (validation_token IS NOT NULL);
