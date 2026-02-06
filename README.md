# Sistema de Carteirinha MAF

Este é um sistema completo para emissão e validação da Carteirinha de Habilitada MAF, construído com Next.js, Shadcn/ui e Supabase.

## Funcionalidades

- **Cadastro Público**: Formulário para solicitação com validação de CPF.
- **Validação Automática**: Verifica se o CPF existe na `students_base`.
- **Portal da Aluna**: Área restrita para acompanhar status e baixar PDF.
- **Painel Admin**: Gestão de solicitações (aprovar, recusar), logs e importação de alunas (CSV).
- **Validação via QR Code**: Página pública para verificar autenticidade.

## Tecnologias

- [Next.js 14+](https://nextjs.org) (App Router, Server Actions)
- [Tailwind CSS](https://tailwindcss.com) + [Shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) (Postgres, Auth, Storage)
- [pdf-lib](https://pdf-lib.js.org) + [qrcode](https://www.npmjs.com/package/qrcode)

## Configuração

1. **Clone o repositório**
2. **Instale as dependências**:
   ```bash
   npm install
   ```
3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env.local` baseado no `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. **Banco de Dados**:
   Rode o script SQL disponível em `migrations/schema.sql` no Painel do Supabase (SQL Editor).
   Ele criará as tabelas `students_base`, `users_cards`, `admin_audit_logs` e os buckets necessários.

5. **Storage**:
   Crie dois buckets públicos no Supabase Storage: `certificates` e `cards`.

## Rodando Localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Configuração do Admin

Para acessar o painel administrativo em `/admin`, você precisa criar um usuário com role de admin:

### Método 1: Via Dashboard do Supabase
1. Acesse o Dashboard do Supabase → Authentication → Users
2. Crie um novo usuário com email e senha
3. Após criar, clique no usuário e vá em "Raw User Meta Data"
4. Adicione o seguinte JSON:
   ```json
   {
     "role": "admin"
   }
   ```
5. Salve as alterações

### Método 2: Via SQL
Execute no SQL Editor do Supabase:
```sql
-- Primeiro, crie o usuário via Dashboard ou Auth API
-- Depois, atualize os metadados:
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'seu-email-admin@example.com';
```

### Credenciais Padrão
**Não existem credenciais padrão por segurança.** Você deve criar seu próprio usuário admin usando um dos métodos acima.

### Acesso ao Admin
- **URL**: `http://localhost:3000/admin/login`
- **Email**: O que você configurou no Supabase
- **Senha**: A que você definiu ao criar o usuário

**Importante**: Apenas usuários com `user_metadata.role = "admin"` podem acessar rotas `/admin/*`. O middleware verifica automaticamente essa permissão.

## Deploy na Vercel

1. Importe o projeto na Vercel.
2. Configure as variáveis de ambiente (`SUPABASE_...`).
3. Deploy!

## Estrutura do Projeto

- `/app`: Páginas e rotas (App Router).
- `/components`: Componentes UI reutilizáveis.
- `/lib`: Utilitários (Supabase client, validadores, gerador de PDF).
- `/migrations`: Scripts SQL.

## Decisões Técnicas

- **Server Actions**: Utilizados para mutações de dados e lógica segura no backend.
- **Supabase Auth**: Autenticação gerenciada.
- **RLS (Row Level Security)**: Deve ser configurado no banco para proteger dados sensíveis (o script SQL fornece uma base).
