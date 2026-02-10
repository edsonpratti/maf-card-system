-- Migration: Otimização de índices baseada nas sugestões do Supabase Linter
-- Data: 2026-02-09
-- 
-- Esta migration resolve os seguintes problemas:
-- 1. Foreign keys sem índice de cobertura (impacta performance de JOINs e cascading deletes)
-- 2. Índices não utilizados (ocupam espaço e impactam performance de escrita)

-- ============================================================================
-- PARTE 1: Adicionar índices para foreign keys sem cobertura
-- ============================================================================

-- Índice para admin_audit_logs.target_user_id
-- Melhora queries que filtram por target_user_id e operações de CASCADE DELETE
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id 
ON public.admin_audit_logs(target_user_id);

-- Índice para users_cards.auth_user_id
-- Melhora queries que buscam cartões por usuário autenticado
CREATE INDEX IF NOT EXISTS idx_users_cards_auth_user_id 
ON public.users_cards(auth_user_id);

-- ============================================================================
-- PARTE 2: Remover índices não utilizados
-- ============================================================================
-- NOTA: Estes índices foram identificados como nunca utilizados pelo Supabase.
-- Se você planeja usar estas colunas em queries futuras, comente estas linhas.

-- Remove índice não utilizado de first_access_token
-- (provavelmente as buscas são feitas pelo token diretamente, não pelo índice)
DROP INDEX IF EXISTS idx_users_cards_first_access_token;

-- Remove índices não utilizados da tabela password_reset_tokens
-- Estas colunas podem já estar cobertas por outros índices ou pelo token único
DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;
DROP INDEX IF EXISTS idx_password_reset_tokens_email;
DROP INDEX IF EXISTS idx_password_reset_tokens_expires_at;

-- ============================================================================
-- PARTE 3: Verificar índices criados
-- ============================================================================
-- Execute esta query para verificar os índices da tabela:
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';

-- ============================================================================
-- NOTA SOBRE Auth DB Connections
-- ============================================================================
-- O Supabase também reportou que a estratégia de conexão do Auth está em modo
-- absoluto (10 conexões). Para melhorar a escalabilidade:
-- 
-- 1. Acesse: Dashboard do Supabase > Settings > Auth
-- 2. Altere "Database Connection Pool Size" para modo percentual
-- 3. Ou configure via API: https://supabase.com/docs/guides/deployment/going-into-prod
--
-- Isso permite que o Auth escale automaticamente ao aumentar o tamanho da instância.
