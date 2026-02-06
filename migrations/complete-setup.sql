-- Script completo para configurar o banco de dados e usuário admin
-- Execute este script completo no SQL Editor do Supabase

-- ==============================================================================
-- PARTE 1: CRIAR SCHEMA DO BANCO DE DADOS
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela Base de Alunas (Imports via CSV)
CREATE TABLE IF NOT EXISTS public.students_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpf VARCHAR(14) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_students_base_cpf ON public.students_base(cpf);

-- 2. Tabela de Usuárias / Habilitadas
DO $$ BEGIN
  CREATE TYPE card_status AS ENUM ('AUTO_APROVADA', 'PENDENTE_MANUAL', 'APROVADA_MANUAL', 'RECUSADA', 'REVOGADA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.users_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  cpf_hash VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  address_json JSONB DEFAULT '{}',
  status card_status NOT NULL DEFAULT 'PENDENTE_MANUAL',
  certificate_file_path TEXT,
  card_pdf_path TEXT,
  card_number VARCHAR(50) UNIQUE,
  validation_token VARCHAR(100) UNIQUE,
  issued_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_cards_cpf ON public.users_cards(cpf);
CREATE INDEX IF NOT EXISTS idx_users_cards_token ON public.users_cards(validation_token);
CREATE INDEX IF NOT EXISTS idx_users_cards_status ON public.users_cards(status);

-- 3. Logs de Auditoria Admin
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID,
  target_user_id UUID REFERENCES public.users_cards(id),
  action VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.students_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if exist and recreate
DROP TRIGGER IF EXISTS update_students_base_modtime ON public.students_base;
CREATE TRIGGER update_students_base_modtime 
  BEFORE UPDATE ON public.students_base 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_cards_modtime ON public.users_cards;
CREATE TRIGGER update_users_cards_modtime 
  BEFORE UPDATE ON public.users_cards 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- PARTE 2: CONFIGURAR USUÁRIO ADMIN
-- ==============================================================================

-- Função helper para verificar se o usuário é admin
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Admins podem ver todos os logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins podem inserir logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins podem ver toda base de estudantes" ON public.students_base;
DROP POLICY IF EXISTS "Admins podem inserir estudantes" ON public.students_base;
DROP POLICY IF EXISTS "Admins podem atualizar estudantes" ON public.students_base;
DROP POLICY IF EXISTS "Admins podem deletar estudantes" ON public.students_base;
DROP POLICY IF EXISTS "Admins podem ver todos os cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Admins podem inserir cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Admins podem atualizar cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Admins podem deletar cartões" ON public.users_cards;
DROP POLICY IF EXISTS "Qualquer um pode validar cartão via token" ON public.users_cards;

-- Políticas para admin_audit_logs
CREATE POLICY "Admins podem ver todos os logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins podem inserir logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Políticas para students_base
CREATE POLICY "Admins podem ver toda base de estudantes"
  ON public.students_base
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins podem inserir estudantes"
  ON public.students_base
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins podem atualizar estudantes"
  ON public.students_base
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins podem deletar estudantes"
  ON public.students_base
  FOR DELETE
  USING (public.is_admin());

-- Políticas para users_cards
CREATE POLICY "Admins podem ver todos os cartões"
  ON public.users_cards
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins podem inserir cartões"
  ON public.users_cards
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins podem atualizar cartões"
  ON public.users_cards
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins podem deletar cartões"
  ON public.users_cards
  FOR DELETE
  USING (public.is_admin());

-- Política para validação pública via token
CREATE POLICY "Qualquer um pode validar cartão via token"
  ON public.users_cards
  FOR SELECT
  USING (validation_token IS NOT NULL);

-- Política para permitir inserções públicas (solicitações de cadastro)
CREATE POLICY "Qualquer um pode criar solicitação"
  ON public.users_cards
  FOR INSERT
  WITH CHECK (true);

-- ==============================================================================
-- SUCESSO!
-- ==============================================================================
-- O banco de dados foi configurado com sucesso.
-- 
-- PRÓXIMOS PASSOS:
-- 1. Vá em Authentication > Users no Dashboard do Supabase
-- 2. Clique em "Add User"
-- 3. Crie um usuário com:
--    - Email: admin@maf.com (ou o que preferir)
--    - Password: (escolha uma senha forte)
--    - Auto Confirm User: ✓ (marcar)
-- 4. Após criar, clique no usuário e adicione no User Metadata:
--    {"is_admin": true, "name": "Administrador MAF"}
-- 5. Teste o login em /admin/login
-- ==============================================================================
