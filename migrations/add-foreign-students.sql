-- Migração: Suporte a alunas estrangeiras (sem CPF)
-- Data: 2026-02-23

-- =======================================================
-- 1. Alterações na tabela students_base
-- =======================================================

-- Adicionar coluna de email de compra
ALTER TABLE public.students_base
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Adicionar flag de estrangeira
ALTER TABLE public.students_base
  ADD COLUMN IF NOT EXISTS is_foreign BOOLEAN NOT NULL DEFAULT false;

-- Tornar CPF opcional (estrangeiras não possuem CPF)
ALTER TABLE public.students_base
  ALTER COLUMN cpf DROP NOT NULL;

-- Remover constraint UNIQUE existente no cpf (será recriada como parcial)
ALTER TABLE public.students_base
  DROP CONSTRAINT IF EXISTS students_base_cpf_key;

-- Constraint UNIQUE parcial: CPF único apenas quando não for nulo
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_base_cpf_unique
  ON public.students_base(cpf)
  WHERE cpf IS NOT NULL;

-- Index para busca por email
CREATE INDEX IF NOT EXISTS idx_students_base_email
  ON public.students_base(email);

-- Constraint: pelo menos CPF ou email deve estar preenchido
ALTER TABLE public.students_base
  ADD CONSTRAINT chk_students_cpf_or_email
  CHECK (cpf IS NOT NULL OR email IS NOT NULL);

-- =======================================================
-- 2. Alterações na tabela users_cards
-- =======================================================

-- Adicionar flag de estrangeira
ALTER TABLE public.users_cards
  ADD COLUMN IF NOT EXISTS is_foreign BOOLEAN NOT NULL DEFAULT false;

-- Tornar CPF opcional para estrangeiras
ALTER TABLE public.users_cards
  ALTER COLUMN cpf DROP NOT NULL;

-- Tornar cpf_hash opcional para estrangeiras
ALTER TABLE public.users_cards
  ALTER COLUMN cpf_hash DROP NOT NULL;

-- Remover constraint UNIQUE existente no cpf (será recriada como parcial)
ALTER TABLE public.users_cards
  DROP CONSTRAINT IF EXISTS users_cards_cpf_key;

-- Constraint UNIQUE parcial: CPF único apenas quando não for nulo
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cards_cpf_unique
  ON public.users_cards(cpf)
  WHERE cpf IS NOT NULL;
