-- Migration: Adicionar foto e data de habilitação
-- Descrição: Adiciona campos para foto da habilitada e data de habilitação ao cartão
-- Data: 2026-02-13

-- Adicionar campo para caminho da foto no Storage
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS photo_path TEXT;

-- Adicionar campo para data de habilitação
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS certification_date DATE;

-- Índice para busca por data de certificação
CREATE INDEX IF NOT EXISTS idx_users_cards_certification_date 
ON public.users_cards(certification_date) 
WHERE certification_date IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.users_cards.photo_path IS 'Caminho da foto da habilitada no Supabase Storage (bucket: photos)';
COMMENT ON COLUMN public.users_cards.certification_date IS 'Data de habilitação da aluna. Se NULL, usar created_at como fallback';
