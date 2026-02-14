# Criar Usuário Admin Inicial no Supabase

## ⚠️ IMPORTANTE: Ordem de Execução

Execute os scripts nesta ordem:
1. **Primeiro**: `migrations/schema.sql` - Cria as tabelas do banco
2. **Depois**: `migrations/seed-admin.sql` - Configura o usuário admin e permissões

## Passo 0: Executar o Schema Principal

Antes de criar o usuário admin, você precisa criar as tabelas do banco de dados:

1. Acesse o Dashboard do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Crie uma nova query
5. Cole o conteúdo do arquivo `migrations/schema.sql`
6. Execute a query (clique em **Run** ou pressione Ctrl+Enter)
7. Verifique se não há erros

### Verificar se as tabelas foram criadas

Execute no SQL Editor:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Deve retornar: `students_base`, `users_cards`, `admin_audit_logs`

---

## Método Recomendado (Via Dashboard)

### Passo 1: Criar o Usuário
1. Acesse o Dashboard do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Authentication** > **Users**
4. Clique em **Add User** (botão verde no canto superior direito)
5. Selecione **Create new user**
6. Preencha os campos:
   - **Email**: `admin@maf.com` (ou o email que preferir)
   - **Password**: Escolha uma senha forte (mínimo 8 caracteres)
   - **Auto Confirm User**: ✓ Marcar esta opção
7. Clique em **Create User**

### Passo 2: Adicionar Permissões de Admin
1. Após criar o usuário, ele aparecerá na lista
2. Clique no usuário recém-criado
3. Vá até a seção **User Metadata**
4. Clique em **Edit** ou adicione diretamente no JSON
5. No campo **User Metadata** (raw_user_meta_data), adicione:
   ```json
   {
     "is_admin": true,
     "name": "Administrador MAF"
   }
   ```
6. Salve as alterações

### Passo 3: Executar Script SQL de Configuração
1. No Dashboard do Supabase, vá em **SQL Editor**
2. Crie uma nova query
3. Cole o conteúdo do arquivo `migrations/seed-admin.sql`
4. Execute a query (clique em **Run** ou pressione Ctrl+Enter)
5. Isso criará:
   - Função helper `is_admin()` para verificar permissões
   - Políticas RLS para controlar o acesso admin

### Passo 4: Verificar a Criação
1. Teste o login na aplicação:
   - Acesse: `http://localhost:3000/admin/login`
   - Use o email e senha criados
2. Verifique se consegue acessar o dashboard admin

## Método Alternativo (Via SQL)

Se preferir criar via SQL (mais avançado):

1. Vá em **SQL Editor** no Dashboard do Supabase
2. Execute o seguinte comando (substitua os valores):

```sql
-- Criar usuário admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@maf.com', -- ALTERE ESTE EMAIL
  crypt('SuaSenhaForte123!', gen_salt('bf')), -- ALTERE ESTA SENHA
  NOW(),
  '{"provider":"email","providers":["email"],"is_admin":true}'::jsonb,
  '{"name":"Administrador MAF","is_admin":true}'::jsonb,
  NOW(),
  NOW(),
  ''
);
```

3. Depois execute o script `migrations/seed-admin.sql` para criar as políticas

## Variáveis de Ambiente Necessárias

Certifique-se de que seu arquivo `.env.local` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

## Credenciais Padrão Sugeridas (ALTERE IMEDIATAMENTE!)

Para facilitar o primeiro acesso:
- **Email**: `admin@maf.com`
- **Senha**: `MAF@Admin2024!`

⚠️ **IMPORTANTE**: Altere estas credenciais imediatamente após o primeiro login!

## Troubleshooting

### Erro: "Email not confirmed"
- Certifique-se de marcar **Auto Confirm User** ao criar o usuário
- Ou confirme manualmente o email no dashboard

### Erro: "Invalid login credentials"
- Verifique se o email e senha estão corretos
- Verifique se o usuário foi criado com sucesso no dashboard

### Erro: "Unauthorized" ao acessar dashboard
- Verifique se o `user_metadata` contém `is_admin: true`
- Execute novamente o script `seed-admin.sql` para criar as políticas RLS

### Não consegue executar operações admin
- Verifique se a função `is_admin()` foi criada corretamente
- Verifique se as políticas RLS foram aplicadas às tabelas
