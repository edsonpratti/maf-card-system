-- ==============================================================================
-- MIGRAÇÃO: Corrigir alertas de segurança do Supabase Database Linter
-- ==============================================================================
-- Este script corrige os seguintes alertas:
--
-- 1. function_search_path_mutable para public.is_admin
-- 2. function_search_path_mutable para public.update_updated_at_column
-- 3. rls_policy_always_true para users_cards_insert_policy
--
-- Nota: O alerta auth_leaked_password_protection deve ser corrigido nas
--       configurações do Supabase Dashboard em:
--       Authentication > Settings > Security > Enable Leaked Password Protection
-- ==============================================================================

-- ==============================================================================
-- PASSO 1: Recriar função is_admin com search_path fixo
-- ==============================================================================
-- O search_path fixo previne ataques de injeção onde um usuário malicioso
-- poderia criar funções com o mesmo nome em um schema diferente

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
$$ LANGUAGE plpgsql 
   SECURITY DEFINER
   SET search_path = public;

-- ==============================================================================
-- PASSO 2: Recriar função update_updated_at_column com search_path fixo
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;

-- ==============================================================================
-- PASSO 3: Corrigir política RLS users_cards_insert_policy
-- ==============================================================================
-- Substituir WITH CHECK (true) por uma condição mais específica
-- que ainda permite solicitações públicas mas com validações

-- Remover política atual (criada em fix-multiple-permissive-policies.sql)
DROP POLICY IF EXISTS "users_cards_insert_policy" ON public.users_cards;

-- Criar política mais restritiva para INSERT
-- Permite inserção quando:
-- 1. O usuário é admin, OU
-- 2. O status é 'pending' (solicitação pública inicial)
-- Isso impede que usuários não-autenticados criem registros com status aprovado
CREATE POLICY "users_cards_insert_policy"
  ON public.users_cards
  FOR INSERT
  WITH CHECK (
    public.is_admin() 
    OR status = 'pending'
  );

-- ==============================================================================
-- NOTAS IMPORTANTES:
-- ==============================================================================
-- 
-- 1. SEARCH_PATH FIXO:
--    - Previne ataques onde schemas maliciosos poderiam interceptar chamadas
--    - Recomendação oficial do Supabase para funções SECURITY DEFINER
--
-- 2. POLÍTICA INSERT RESTRITIVA:
--    - Usuários públicos só podem criar solicitações com status 'pending'
--    - Apenas admins podem criar registros com outros status
--    - Mantém funcionalidade do formulário público de solicitação
--
-- 3. LEAKED PASSWORD PROTECTION:
--    - Este alerta NÃO pode ser corrigido via SQL
--    - Acesse: Supabase Dashboard > Authentication > Settings
--    - Ative: "Enable Leaked Password Protection (HaveIBeenPwned)"
--
-- ==============================================================================
