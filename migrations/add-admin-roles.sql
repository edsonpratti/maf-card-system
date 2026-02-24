-- =============================================================================
-- MIGRAÇÃO: Sistema de Papéis e Permissões para Admin Users
-- Executar no SQL Editor do Supabase Dashboard
-- =============================================================================

-- 1. Adiciona colunas de papel, permissões e rastreabilidade à tabela admin_users
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'master'
    CHECK (role IN ('master', 'operator')),
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by_email VARCHAR(255);

-- 2. Garante que todos os admins existentes sejam promovidos a master
UPDATE public.admin_users
SET role = 'master'
WHERE role IS NULL OR role = 'master';

-- 3. Comentários para documentação
COMMENT ON COLUMN public.admin_users.role IS
  'Papel do administrador: master (acesso irrestrito) ou operator (acesso limitado a módulos específicos)';

COMMENT ON COLUMN public.admin_users.permissions IS
  'Array de chaves de módulos liberados para operadores. Ex: ["maf-pro-id", "usuarios"]. Ignorado para masters.';

COMMENT ON COLUMN public.admin_users.created_by_email IS
  'Email do admin master que cadastrou este usuário.';

-- 4. Índice para busca por role
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);

-- Verificação final
SELECT id, name, email, role, permissions, created_at
FROM public.admin_users
ORDER BY created_at DESC;
