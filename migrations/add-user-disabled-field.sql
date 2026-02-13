-- Adicionar campo is_disabled para permitir desabilitar usuários sem excluí-los
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE;

-- Índice para filtrar usuários desabilitados
CREATE INDEX IF NOT EXISTS idx_users_cards_is_disabled ON public.users_cards(is_disabled);

-- Comentário
COMMENT ON COLUMN public.users_cards.is_disabled IS 'Indica se o usuário está desabilitado (não pode acessar o sistema)';
