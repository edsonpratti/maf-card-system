-- Migration: Tabela para tokens de recuperação de senha
-- Data: 2026-02-09
-- Descrição: Cria tabela para armazenar tokens de reset de senha via Resend

-- Criar tabela de tokens de recuperação
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Política RLS (Row Level Security)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Permitir que service role faça tudo
CREATE POLICY "Service role tem acesso total aos tokens"
    ON password_reset_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comentários
COMMENT ON TABLE password_reset_tokens IS 'Tokens de recuperação de senha enviados via Resend';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'ID do usuário do Supabase Auth';
COMMENT ON COLUMN password_reset_tokens.email IS 'Email do usuário para verificação';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único de recuperação (hash)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data/hora de expiração do token (30 minutos)';
COMMENT ON COLUMN password_reset_tokens.used IS 'Se o token já foi utilizado';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Quando o token foi utilizado';
