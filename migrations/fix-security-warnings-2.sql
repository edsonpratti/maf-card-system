-- ==============================================================================
-- MIGRAÇÃO: Corrigir alertas de segurança — lote 2
-- ==============================================================================
-- Corrige os seguintes alertas do Supabase Database Linter:
--
-- WARN  function_search_path_mutable → 7 funções sem SET search_path fixo
--   - public.clean_expired_2fa_codes
--   - public.update_tasks_updated_at
--   - public.update_maf_tasks_updated_at
--   - public.is_survey_active
--   - public.get_survey_analytics
--   - public.is_admin
--   - public.update_updated_at_column
--
-- WARN  rls_policy_always_true → 3 políticas com WITH CHECK (true)
--   - public.survey_responses  → "Public can submit responses"
--   - public.survey_answers    → "Public can submit answers"
--   - public.users_cards       → "users_cards_insert_policy"
--
-- WARN  auth_leaked_password_protection → NÃO pode ser corrigido via SQL.
--   Acesse: Supabase Dashboard > Authentication > Settings > Security
--   Ative: "Enable Leaked Password Protection (HaveIBeenPwned)"
-- ==============================================================================


-- ==============================================================================
-- PARTE 1: Fixar search_path nas funções
-- ==============================================================================
-- Um search_path mutável permite que um usuário malicioso crie funções/objetos
-- com o mesmo nome em um schema de menor prioridade para interceptar chamadas.
-- SET search_path = public garante que apenas objetos do schema public são usados.


-- 1a. clean_expired_2fa_codes
CREATE OR REPLACE FUNCTION public.clean_expired_2fa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.admin_2fa_codes
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

-- 1b. update_tasks_updated_at  (versão legada — ainda existe no banco)
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;

-- 1c. update_maf_tasks_updated_at
CREATE OR REPLACE FUNCTION public.update_maf_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;

-- 1d. is_survey_active
CREATE OR REPLACE FUNCTION public.is_survey_active(survey_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.surveys
    WHERE id = survey_id_param
      AND status = 'active'
      AND start_date <= NOW()
      AND (end_date IS NULL OR end_date >= NOW())
  );
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- 1e. get_survey_analytics
CREATE OR REPLACE FUNCTION public.get_survey_analytics(survey_id_param UUID)
RETURNS TABLE (
  total_responses    BIGINT,
  completed_responses BIGINT,
  completion_rate    NUMERIC,
  avg_completion_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT                                                          AS total_responses,
    COUNT(completed_at)::BIGINT                                               AS completed_responses,
    CASE
      WHEN COUNT(*) > 0
        THEN ROUND((COUNT(completed_at)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END                                                                       AS completion_rate,
    AVG(completed_at - started_at)                                            AS avg_completion_time
  FROM public.survey_responses
  WHERE survey_id = survey_id_param;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- 1f. is_admin
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

-- 1g. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- ==============================================================================
-- PARTE 2: Restringir políticas INSERT com WITH CHECK (true)
-- ==============================================================================
-- Políticas com "true" incondicionalmente permitem qualquer inserção,
-- incluindo dados inválidos ou maliciosos. Substituímos por condições mínimas
-- que preservam o fluxo legítimo sem abrir brechas.


-- 2a. survey_responses — exige que o survey referenciado esteja ativo
DROP POLICY IF EXISTS "Public can submit responses" ON public.survey_responses;

CREATE POLICY "Public can submit responses"
  ON public.survey_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.surveys
      WHERE surveys.id = survey_id
        AND surveys.status = 'active'
        AND surveys.start_date <= NOW()
        AND (surveys.end_date IS NULL OR surveys.end_date >= NOW())
    )
  );

-- 2b. survey_answers — exige que a resposta (response_id) pertença a um survey ativo
DROP POLICY IF EXISTS "Public can submit answers" ON public.survey_answers;

CREATE POLICY "Public can submit answers"
  ON public.survey_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.survey_responses sr
      JOIN public.surveys s ON s.id = sr.survey_id
      WHERE sr.id = response_id
        AND s.status = 'active'
        AND s.start_date <= NOW()
        AND (s.end_date IS NULL OR s.end_date >= NOW())
    )
  );

-- 2c. users_cards — apenas solicitações públicas iniciais (status 'PENDENTE_MANUAL') ou admins
DROP POLICY IF EXISTS "users_cards_insert_policy" ON public.users_cards;

CREATE POLICY "users_cards_insert_policy"
  ON public.users_cards
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR status = 'PENDENTE_MANUAL'
  );


-- ==============================================================================
-- VERIFICAÇÃO
-- ==============================================================================

-- Funções com search_path fixo
SELECT
  routine_schema,
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'clean_expired_2fa_codes',
    'update_tasks_updated_at',
    'update_maf_tasks_updated_at',
    'is_survey_active',
    'get_survey_analytics',
    'is_admin',
    'update_updated_at_column'
  )
ORDER BY routine_name;

-- Políticas INSERT atualizadas
SELECT
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('survey_responses', 'survey_answers', 'users_cards')
  AND cmd = 'INSERT'
ORDER BY tablename, policyname;
