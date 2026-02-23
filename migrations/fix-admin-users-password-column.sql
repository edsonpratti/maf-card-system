-- Remove a obrigatoriedade da coluna password em admin_users
-- pois a autenticação agora é gerenciada pelo Supabase Auth
ALTER TABLE admin_users ALTER COLUMN password DROP NOT NULL;
