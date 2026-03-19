-- Migração: Ampliar coluna whatsapp para suportar telefones internacionais
-- Data: 2026-03-18
-- Motivo: whatsapp VARCHAR(20) pode truncar números internacionais com código de país
--         Ex: "+351 912345678" (15 chars) OK, mas "+1 555 123-4567" formatado pode exceder

ALTER TABLE public.users_cards
  ALTER COLUMN whatsapp TYPE VARCHAR(30);
