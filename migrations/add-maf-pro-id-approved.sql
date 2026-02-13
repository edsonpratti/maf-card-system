-- Migração: Adicionar campos de aprovação do MAF Pro ID
-- Data: 2026-02-13

-- Adicionar coluna maf_pro_id_approved
ALTER TABLE users_cards 
ADD COLUMN IF NOT EXISTS maf_pro_id_approved BOOLEAN DEFAULT false;

-- Adicionar coluna maf_pro_id_approved_at
ALTER TABLE users_cards 
ADD COLUMN IF NOT EXISTS maf_pro_id_approved_at TIMESTAMPTZ;

-- Adicionar coluna maf_pro_id_approved_by
ALTER TABLE users_cards 
ADD COLUMN IF NOT EXISTS maf_pro_id_approved_by UUID REFERENCES auth.users(id);

-- Atualizar usuários já aprovados (AUTO_APROVADA ou APROVADA_MANUAL) para terem maf_pro_id_approved = true
UPDATE users_cards 
SET 
    maf_pro_id_approved = true,
    maf_pro_id_approved_at = COALESCE(issued_at, updated_at, created_at)
WHERE status IN ('AUTO_APROVADA', 'APROVADA_MANUAL')
  AND maf_pro_id_approved IS NOT TRUE;

-- Criar índice para consultas
CREATE INDEX IF NOT EXISTS idx_users_cards_maf_pro_id_approved 
ON users_cards(maf_pro_id_approved) WHERE maf_pro_id_approved = true;

-- Comentário explicativo
COMMENT ON COLUMN users_cards.maf_pro_id_approved IS 'Indica se o usuário tem acesso liberado ao módulo MAF Pro ID (carteira profissional)';
COMMENT ON COLUMN users_cards.maf_pro_id_approved_at IS 'Data/hora da aprovação do MAF Pro ID';
COMMENT ON COLUMN users_cards.maf_pro_id_approved_by IS 'ID do admin que aprovou o MAF Pro ID';
