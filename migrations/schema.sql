
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela Base de Alunas (Imports via CSV)
CREATE TABLE public.students_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpf VARCHAR(14) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX idx_students_base_cpf ON public.students_base(cpf);

-- 2. Tabela de Usuárias / Habilitadas
CREATE TYPE card_status AS ENUM ('AUTO_APROVADA', 'PENDENTE_MANUAL', 'APROVADA_MANUAL', 'RECUSADA', 'REVOGADA');

CREATE TABLE public.users_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  cpf_hash VARCHAR(255) NOT NULL, -- Para buscas rápidas e seguras se necessário
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  address_json JSONB DEFAULT '{}',
  status card_status NOT NULL DEFAULT 'PENDENTE_MANUAL',
  certificate_file_path TEXT, -- Path no Storage
  card_pdf_path TEXT, -- Path no Storage
  card_number VARCHAR(50) UNIQUE,
  validation_token VARCHAR(100) UNIQUE, -- Token público para QR Code
  issued_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_cards_cpf ON public.users_cards(cpf);
CREATE INDEX idx_users_cards_token ON public.users_cards(validation_token);
CREATE INDEX idx_users_cards_status ON public.users_cards(status);

-- 3. Logs de Auditoria Admin
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID, -- Referência ao auth.users se usar auth do Supabase
  target_user_id UUID REFERENCES public.users_cards(id),
  action VARCHAR(50) NOT NULL, -- 'APPROVE', 'REJECT', 'REVOKE', 'UPLOAD_CSV'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Exemplo básico, ajustar conforme auth)
ALTER TABLE public.students_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin pode tudo, Publico pode ler apenas validação via função segura
-- Mas para simplificar aqui, vamos permitir leitura pública apenas via RPC ou wrapper
-- Usuário autenticado pode ler seus próprios dados

-- Storage policies need bucket 'certificates' and 'cards'
-- Helper function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_base_modtime BEFORE UPDATE ON public.students_base FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_cards_modtime BEFORE UPDATE ON public.users_cards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
