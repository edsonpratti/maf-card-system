-- Tabela para armazenar configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Índice para busca rápida por chave
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_settings_modtime 
    BEFORE UPDATE ON public.system_settings 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Inserir configurações padrão de validação
INSERT INTO public.system_settings (key, settings) VALUES (
    'validation_settings',
    '{
        "auto_validation_enabled": true,
        "require_certificate_upload": true,
        "auto_send_first_access_email": true,
        "rejection_email_enabled": true,
        "default_rejection_message": "Seu certificado não pôde ser validado. Por favor, entre em contato para mais informações."
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;
