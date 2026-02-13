/**
 * Script para verificar e exibir SQL de migração para maf_pro_id_approved
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMigration() {
  console.log('Verificando coluna maf_pro_id_approved...\n');
  
  const { data, error } = await supabase
    .from('users_cards')
    .select('maf_pro_id_approved')
    .limit(1);
  
  if (error && error.message.includes('does not exist')) {
    console.log('❌ Coluna maf_pro_id_approved NÃO existe no banco de dados.\n');
    console.log('='.repeat(60));
    console.log('Execute o seguinte SQL no Supabase Dashboard:');
    console.log('='.repeat(60));
    console.log(`
-- Adicionar colunas de aprovação do MAF Pro ID
ALTER TABLE users_cards 
ADD COLUMN IF NOT EXISTS maf_pro_id_approved BOOLEAN DEFAULT false;

ALTER TABLE users_cards 
ADD COLUMN IF NOT EXISTS maf_pro_id_approved_at TIMESTAMPTZ;

ALTER TABLE users_cards 
ADD COLUMN IF NOT EXISTS maf_pro_id_approved_by UUID;

-- Atualizar usuários já aprovados
UPDATE users_cards 
SET 
    maf_pro_id_approved = true,
    maf_pro_id_approved_at = COALESCE(issued_at, updated_at, created_at)
WHERE status IN ('AUTO_APROVADA', 'APROVADA_MANUAL')
  AND (maf_pro_id_approved IS NULL OR maf_pro_id_approved = false);
`);
    console.log('='.repeat(60));
  } else if (error) {
    console.log('Erro:', error.message);
  } else {
    console.log('✅ Coluna maf_pro_id_approved já existe!');
    console.log('Dados:', data);
  }
}

checkMigration();
