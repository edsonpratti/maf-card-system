-- Migration: Atualizar tabela users_cards para novo fluxo
-- Descrição: Usuário já recebe acesso imediato ao cadastrar, mas MAF PRO ID só após validação
-- Data: 2026-02-13

-- Adicionar campo para marcar quando o primeiro acesso foi completado
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS first_access_completed_at TIMESTAMPTZ;

-- Adicionar campos para token de recuperação de senha
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);

ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS reset_password_token_expires_at TIMESTAMPTZ;

-- Adicionar campo para indicar se a conta está ativa (pode fazer login)
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Índice para busca por token de recuperação
CREATE INDEX IF NOT EXISTS idx_users_cards_reset_password_token 
ON public.users_cards(reset_password_token) 
WHERE reset_password_token IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.users_cards.first_access_completed_at IS 'Data/hora em que o usuário definiu sua senha inicial';
COMMENT ON COLUMN public.users_cards.reset_password_token IS 'Token para recuperação de senha';
COMMENT ON COLUMN public.users_cards.reset_password_token_expires_at IS 'Data/hora de expiração do token de recuperação';
COMMENT ON COLUMN public.users_cards.is_active IS 'Indica se a conta está ativa e pode fazer login';
