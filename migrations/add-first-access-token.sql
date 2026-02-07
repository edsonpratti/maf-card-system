-- Migration: Adicionar suporte para primeiro acesso
-- Permite que usuários definam senha após aprovação da carteirinha

-- Adicionar coluna para vincular com auth.users
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar token para primeiro acesso / definição de senha
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS first_access_token VARCHAR(100) UNIQUE;

-- Adicionar timestamp de expiração do token (válido por 7 dias)
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS first_access_token_expires_at TIMESTAMPTZ;

-- Adicionar flag para indicar se já completou primeiro acesso
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS first_access_completed BOOLEAN DEFAULT FALSE;

-- Index para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_users_cards_first_access_token 
ON public.users_cards(first_access_token) 
WHERE first_access_token IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.users_cards.auth_user_id IS 'UUID do usuário no auth.users do Supabase';
COMMENT ON COLUMN public.users_cards.first_access_token IS 'Token único para primeiro acesso e definição de senha';
COMMENT ON COLUMN public.users_cards.first_access_token_expires_at IS 'Data de expiração do token de primeiro acesso';
COMMENT ON COLUMN public.users_cards.first_access_completed IS 'Indica se o usuário já completou o primeiro acesso';
