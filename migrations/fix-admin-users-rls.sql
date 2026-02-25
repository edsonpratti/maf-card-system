-- ==============================================================================
-- MIGRAÇÃO: Habilitar RLS na tabela admin_users
-- ==============================================================================
-- Corrige os seguintes alertas do Supabase Database Linter:
--
-- 1. rls_disabled_in_public → RLS não estava habilitado em public.admin_users
-- 2. sensitive_columns_exposed → coluna `password` exposta sem proteção RLS
--
-- IMPACTO: Nenhum. Todo o acesso a esta tabela é feito server-side via
-- getServiceSupabase() (service role key), que ignora RLS por definição.
-- Habilitar RLS apenas bloqueia o acesso público via REST API (anon/authenticated),
-- que nunca deveria ter acesso a esta tabela.
-- ==============================================================================

-- ==============================================================================
-- PASSO 1: Habilitar RLS na tabela admin_users
-- ==============================================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PASSO 2: Criar políticas restritivas
-- ==============================================================================
-- Apenas usuários autenticados com is_admin=true nos metadados do JWT
-- têm acesso via RLS. O service role ignora essas políticas e continua
-- funcionando normalmente.

-- Remover políticas antigas caso existam (idempotência)
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON public.admin_users;

-- SELECT: apenas admins autenticados
CREATE POLICY "admin_users_select_policy"
  ON public.admin_users
  FOR SELECT
  USING (public.is_admin());

-- INSERT: apenas admins autenticados
CREATE POLICY "admin_users_insert_policy"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: apenas admins autenticados
CREATE POLICY "admin_users_update_policy"
  ON public.admin_users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: apenas admins autenticados
CREATE POLICY "admin_users_delete_policy"
  ON public.admin_users
  FOR DELETE
  USING (public.is_admin());

-- ==============================================================================
-- VERIFICAÇÃO
-- ==============================================================================
-- Confirma que RLS está ativo e as políticas foram criadas
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'admin_users';

SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_users'
ORDER BY policyname;

-- ==============================================================================
-- NOTAS:
-- ==============================================================================
-- 1. O service role (usado em getServiceSupabase()) contorna o RLS e
--    continuará funcionando sem alterações no código da aplicação.
--
-- 2. A função public.is_admin() verifica:
--    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean
--    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean
--    Isso é consistente com a verificação em lib/auth.ts (verifyAdminAccess).
--
-- 3. Nenhum usuário público (anon) ou autenticado comum terá acesso à tabela
--    via REST API, eliminando os alertas rls_disabled_in_public e
--    sensitive_columns_exposed.
-- ==============================================================================
