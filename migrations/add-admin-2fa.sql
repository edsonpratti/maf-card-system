-- Criar tabela para códigos 2FA de administradores
CREATE TABLE IF NOT EXISTS public.admin_2fa_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT
);

-- Índices para performance
CREATE INDEX idx_admin_2fa_codes_email ON public.admin_2fa_codes(email);
CREATE INDEX idx_admin_2fa_codes_code ON public.admin_2fa_codes(code);
CREATE INDEX idx_admin_2fa_codes_expires_at ON public.admin_2fa_codes(expires_at);

-- Comentários para documentação
COMMENT ON TABLE public.admin_2fa_codes IS 'Armazena códigos temporários de autenticação de dois fatores para administradores';
COMMENT ON COLUMN public.admin_2fa_codes.code IS 'Código de 6 dígitos enviado por email';
COMMENT ON COLUMN public.admin_2fa_codes.expires_at IS 'Data/hora de expiração do código (padrão: 10 minutos)';
COMMENT ON COLUMN public.admin_2fa_codes.used IS 'Indica se o código já foi utilizado';

-- RLS Policies
ALTER TABLE public.admin_2fa_codes ENABLE ROW LEVEL SECURITY;

-- Apenas o sistema pode ler/escrever nesta tabela (sem acesso direto de usuários)
CREATE POLICY "Service role only" ON public.admin_2fa_codes
    FOR ALL
    USING (false);

-- Função para limpar códigos expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION clean_expired_2fa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.admin_2fa_codes
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

COMMENT ON FUNCTION clean_expired_2fa_codes() IS 'Remove códigos 2FA expirados há mais de 1 dia';
