-- Migração: Corrigir Foreign Key da tabela admin_audit_logs
-- Problema: A FK para target_user_id impede exclusão de usuários que têm logs associados
-- Solução: Alterar para ON DELETE SET NULL (preserva o log, mas remove a referência ao usuário excluído)

-- 1. Remover a constraint existente
ALTER TABLE public.admin_audit_logs 
DROP CONSTRAINT IF EXISTS admin_audit_logs_target_user_id_fkey;

-- 2. Recriar a constraint com ON DELETE SET NULL
ALTER TABLE public.admin_audit_logs 
ADD CONSTRAINT admin_audit_logs_target_user_id_fkey 
FOREIGN KEY (target_user_id) 
REFERENCES public.users_cards(id) 
ON DELETE SET NULL;

-- Nota: Isso permite que quando um usuário for excluído:
-- - Os logs de auditoria serão preservados (para histórico)
-- - O campo target_user_id será definido como NULL
-- - A exclusão do usuário será bem-sucedida
