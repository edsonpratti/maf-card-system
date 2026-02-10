-- ==============================================================================
-- MIGRAÇÃO: Corrigir múltiplas políticas permissivas na tabela users_cards
-- ==============================================================================
-- Este script consolida políticas RLS que estavam duplicadas para a mesma
-- role e ação, melhorando a performance das queries.
--
-- Problema detectado pelo Supabase Database Linter:
-- - Múltiplas políticas permissivas para INSERT (anon, authenticated, etc.)
-- - Múltiplas políticas permissivas para SELECT (anon, authenticated, etc.)
--
-- Solução: Consolidar em uma única política por ação usando OR nas condições
-- ==============================================================================

-- ==============================================================================
-- PASSO 1: Remover políticas duplicadas existentes
-- ==============================================================================

-- Remover políticas de SELECT duplicadas
DROP POLICY IF EXISTS "Admins podem ver todos os cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Qualquer um pode validar cartão via token" ON public.users_cards;

-- Remover políticas de INSERT duplicadas
DROP POLICY IF EXISTS "Admins podem inserir cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Qualquer um pode criar solicitação" ON public.users_cards;

-- ==============================================================================
-- PASSO 2: Criar políticas consolidadas
-- ==============================================================================

-- Política consolidada para SELECT
-- Permite: Admins verem tudo OU qualquer um validar via token público
CREATE POLICY "users_cards_select_policy"
  ON public.users_cards
  FOR SELECT
  USING (
    public.is_admin() 
    OR validation_token IS NOT NULL
  );

-- Política consolidada para INSERT
-- Permite: Admins inserirem OU qualquer um criar solicitação
-- Nota: Como "qualquer um pode criar" já inclui admins, simplificamos para true
-- Mas mantemos a lógica explícita para clareza e possíveis restrições futuras
CREATE POLICY "users_cards_insert_policy"
  ON public.users_cards
  FOR INSERT
  WITH CHECK (true);

-- ==============================================================================
-- NOTAS:
-- ==============================================================================
-- 1. As políticas de UPDATE e DELETE permanecem inalteradas (apenas admins)
-- 2. A política de INSERT com "true" permite que qualquer um crie solicitações
--    Isso é necessário para o fluxo de cadastro público
-- 3. A política de SELECT permite:
--    - Admins verem TODOS os registros
--    - Usuários públicos verem APENAS registros com validation_token (para validação QR)
-- ==============================================================================
