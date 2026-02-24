-- =============================================================================
-- MIGRAÇÃO: Tabela de Tokens para Troca de Email no Perfil
-- Executar no SQL Editor do Supabase Dashboard
-- =============================================================================

-- Tabela para armazenar tokens temporários de troca de email
CREATE TABLE IF NOT EXISTS public.email_change_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  old_email VARCHAR(255) NOT NULL,
  new_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_token ON public.email_change_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_user_id ON public.email_change_tokens(user_id);

-- RLS: apenas o serviço (service role) pode acessar
ALTER TABLE public.email_change_tokens ENABLE ROW LEVEL SECURITY;

-- Comentários
COMMENT ON TABLE public.email_change_tokens IS 'Tokens temporários para confirmação de troca de email pelo usuário logado';
COMMENT ON COLUMN public.email_change_tokens.token IS 'Token seguro (hex 64 chars) enviado por email';
COMMENT ON COLUMN public.email_change_tokens.expires_at IS 'Expiração em 30 minutos após criação';

-- Verificação final
SELECT COUNT(*) AS tokens_criados FROM public.email_change_tokens;
