-- =============================================================================
-- MIGRAÇÃO: Adicionar papel Super Administrador
-- Executar no SQL Editor do Supabase Dashboard
-- =============================================================================

-- 1. Remover o CHECK constraint antigo (que só permitia 'master' e 'operator')
ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- 2. Recriar o CHECK constraint incluindo 'super_admin'
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('super_admin', 'master', 'operator'));

-- 3. Atualizar comentário da coluna
COMMENT ON COLUMN public.admin_users.role IS
  'Papel do administrador: super_admin (controle total sobre outros admins), master (acesso irrestrito aos módulos) ou operator (acesso limitado a módulos específicos)';

-- =============================================================================
-- COMO DESIGNAR O PRIMEIRO SUPER ADMINISTRADOR
-- =============================================================================
-- Opção A: Promover um administrador já existente na tabela admin_users
--   Substitua 'email@exemplo.com' pelo email do admin que deseja promover.
--
-- UPDATE public.admin_users
-- SET role = 'super_admin', permissions = '[]'::jsonb
-- WHERE email = 'email@exemplo.com';

-- Opção B: Criar um novo super admin do zero
--   (Crie o usuário no Supabase Auth primeiro, depois rode este INSERT)
--
-- INSERT INTO public.admin_users (name, email, role, permissions, created_by_email)
-- VALUES ('Nome Completo', 'email@exemplo.com', 'super_admin', '[]'::jsonb, null);

-- =============================================================================
-- DESIGNAR edsonpratti@gmail.com COMO SUPER ADMIN
-- =============================================================================
-- Este usuário existe apenas nos metadados do Supabase Auth (tag "Sistema").
-- O INSERT abaixo o registra na tabela admin_users com papel super_admin.
-- O ON CONFLICT garante que não haverá duplicata caso já exista.

INSERT INTO public.admin_users (name, email, role, permissions, created_by_email)
VALUES ('Edson Pratti', 'edsonpratti@gmail.com', 'super_admin', '[]'::jsonb, null)
ON CONFLICT (email) DO UPDATE
  SET role = 'super_admin', permissions = '[]'::jsonb;

-- Verificação final
SELECT id, name, email, role, permissions, created_at
FROM public.admin_users
ORDER BY created_at DESC;
