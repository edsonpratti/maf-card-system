-- Adicionar campos para controle de aprovação do MAF Pro ID
-- Permite que usuários façam login mas tenham acesso restrito ao MAF Pro ID até aprovação do admin

-- Adicionar campo de aprovação do MAF Pro ID
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS maf_pro_id_approved BOOLEAN DEFAULT FALSE;

-- Adicionar campo de data de aprovação
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS maf_pro_id_approved_at TIMESTAMPTZ;

-- Adicionar campo para rastrear qual admin aprovou
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS maf_pro_id_approved_by UUID REFERENCES auth.users(id);

-- Criar índice para filtrar por status de aprovação
CREATE INDEX IF NOT EXISTS idx_users_cards_maf_pro_id_approved 
ON public.users_cards(maf_pro_id_approved);

-- Comentários para documentação
COMMENT ON COLUMN public.users_cards.maf_pro_id_approved IS 'Indica se o usuário tem acesso aprovado ao módulo MAF Pro ID';
COMMENT ON COLUMN public.users_cards.maf_pro_id_approved_at IS 'Data e hora em que o acesso ao MAF Pro ID foi aprovado';
COMMENT ON COLUMN public.users_cards.maf_pro_id_approved_by IS 'ID do admin que aprovou o acesso ao MAF Pro ID';

-- Migração de dados existentes
-- Usuários com status AUTO_APROVADA ou APROVADA_MANUAL recebem aprovação automática
UPDATE public.users_cards 
SET 
    maf_pro_id_approved = TRUE,
    maf_pro_id_approved_at = COALESCE(issued_at, created_at)
WHERE status IN ('AUTO_APROVADA', 'APROVADA_MANUAL')
AND maf_pro_id_approved IS NULL;

-- Usuários com status PENDENTE_MANUAL permanecem sem aprovação
-- (já é o padrão FALSE, mas deixando explícito)
UPDATE public.users_cards 
SET maf_pro_id_approved = FALSE
WHERE status = 'PENDENTE_MANUAL'
AND maf_pro_id_approved IS NULL;
