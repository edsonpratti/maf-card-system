# Configuração do Painel Administrativo

## 🔐 Sistema de Autenticação

O painel administrativo está protegido por um middleware que verifica:
1. Se o usuário está autenticado (via Supabase Auth)
2. Se o usuário possui `role: "admin"` nos metadados

## 📝 Como Criar um Usuário Admin

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o Dashboard do Supabase
2. Vá em **Authentication** → **Users**
3. Clique em **Add User** → **Create new user**
4. Preencha:
   - Email: `admin@maf.com` (ou o email que preferir)
   - Password: Uma senha segura
   - **Auto Confirm User**: ✅ Marque esta opção
5. Clique em **Create user**
6. Após criar, clique no usuário recém-criado na lista
7. Role até **Raw User Meta Data**
8. Clique em **Edit**
9. Adicione o seguinte JSON:
   ```json
   {
     "role": "admin"
   }
   ```
10. Clique em **Save**

### Opção 2: Via SQL Editor

```sql
-- 1. Primeiro crie o usuário via Dashboard ou API
-- 2. Depois execute este SQL para adicionar a role:

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@maf.com'; -- Substitua pelo email do seu admin

-- Verifique se funcionou:
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'admin@maf.com';
```

### Opção 3: Via API (Programático)

```typescript
// Use isso em um script one-time ou função administrativa
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Use a Service Role Key
)

const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@maf.com',
  password: 'SenhaSegura123!',
  email_confirm: true,
  user_metadata: {
    role: 'admin'
  }
})
```

## 🚀 Acesso ao Painel

Depois de criar o usuário admin:

1. Acesse: `http://localhost:3000/admin/login` (dev) ou `https://seudominio.com/admin/login` (prod)
2. Entre com as credenciais:
   - **Email**: O email que você configurou
   - **Senha**: A senha que você definiu
3. Você será redirecionado para `/admin/dashboard`

## 🛡️ Proteção de Rotas

O middleware implementado em [`middleware.ts`](middleware.ts) protege automaticamente:

- ✅ **`/admin/login`**: Acessível sem autenticação (mas redireciona admins já logados)
- 🔒 **`/admin/*`**: Requer autenticação E role de admin
- ❌ Usuários não autenticados → redirecionados para `/admin/login`
- ❌ Usuários autenticados sem role admin → redirecionados para `/`

## 🔧 Funcionalidades Admin Implementadas

### Dashboard (`/admin/dashboard`)
- Métricas gerais do sistema
- Cards com contadores (pendentes, aprovadas, recusadas)

### Solicitações (`/admin/solicitacoes`)
- Listagem de todas as solicitações
- Filtros por status (Todas/Pendentes/Aprovadas/Recusadas)
- Visualização detalhada de cada solicitação
- Ações: Aprovar, Recusar (com motivo), Deletar

### Base de Alunas (`/admin/base-alunas`)
- Adicionar aluna manualmente
- Importar CSV em massa
- Listar alunas cadastradas
- Deletar alunas da base

### Logs de Auditoria (`/admin/logs`)
- ⚠️ Menu criado, página ainda não implementada
- Registra todas as ações administrativas

### Layout
- Menu lateral com navegação
- Exibe email do admin logado
- Botão de logout funcional

## 🔐 Segurança

### Verificações Implementadas:
- ✅ Middleware protege rotas
- ✅ Server Actions usam Service Role (não expõe credenciais)
- ✅ Logs de auditoria para todas as ações
- ✅ Cookies HTTP-only para sessão

### Próximas Melhorias de Segurança:
- [ ] Rate limiting no login
- [ ] 2FA para admins
- [ ] IP whitelist (opcional)
- [ ] Sessão com timeout
- [ ] Verificação adicional de permissões em cada Server Action

## 📱 Logout

Para fazer logout:
1. Clique no botão **"Sair"** no menu lateral
2. Você será deslogado e redirecionado para `/admin/login`

## 🐛 Troubleshooting

### Não consigo fazer login
- Verifique se o usuário tem `role: "admin"` nos metadados
- Confirme que o email está verificado no Supabase
- Verifique as variáveis de ambiente (`.env.local`)

### Erro "Unauthorized" mesmo logado
- Verifique se o `user_metadata.role` está exatamente como `"admin"` (case-sensitive)
- Limpe os cookies do navegador e tente novamente
- Verifique no Supabase Dashboard se os metadados estão corretos

### Middleware não está funcionando
- Certifique-se de que `middleware.ts` está na raiz do projeto
- Reinicie o servidor de desenvolvimento (`npm run dev`)
- Verifique se há erros no console do terminal

### Variáveis de ambiente faltando
Verifique se `.env.local` tem:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📚 Recursos Adicionais

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
