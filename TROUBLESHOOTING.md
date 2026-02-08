# Configuração de Variáveis de Ambiente

## ⚠️ IMPORTANTE: Erro de Servidor (Error: An error occurred in the Server Components render)

Se você está vendo este erro no console:

```
Uncaught Error: An error occurred in the Server Components render. 
The specific message is omitted in production builds to avoid leaking sensitive details.
```

**Causa:** Faltam as variáveis de ambiente necessárias ou há problemas de configuração.

## 🔧 Solução: Configurar .env.local

### Passo 1: Criar o arquivo .env.local

Na raiz do projeto, crie um arquivo chamado `.env.local`:

```bash
cp .env.example .env.local
```

### Passo 2: Preencher as variáveis

Abra o arquivo `.env.local` e preencha com suas credenciais do Supabase:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

### Passo 3: Obter as credenciais do Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **NUNCA compartilhe esta chave!**

### Passo 4: Reiniciar o servidor

Após configurar o `.env.local`:

```bash
# Parar o servidor atual (Ctrl+C)
# Limpar o cache
rm -rf .next

# Reiniciar em modo desenvolvimento
npm run dev

# OU em modo produção
npm run build
npm start
```

## 📋 Checklist de Solução

- [ ] Arquivo `.env.local` criado na raiz do projeto
- [ ] Todas as 3 variáveis preenchidas corretamente
- [ ] URLs sem espaços ou caracteres extras
- [ ] Servidor Next.js reiniciado
- [ ] Cache `.next` limpo

## 🐛 Outras Causas Possíveis

### 1. Console.log em produção (✅ CORRIGIDO)
- Removidos todos os `console.log()` e `console.error()` do código
- Isso previne vazamento de informações sensíveis

### 2. Async/Await em Server Components (✅ OK)
- O código já usa corretamente `await params` no Next.js 15+

### 3. Erro de Build
Se o erro persistir após configurar as variáveis:

```bash
# Limpar completamente
rm -rf .next node_modules
npm install
npm run build
```

## 📝 Verificar Configuração

Para verificar se as variáveis estão carregadas:

```bash
# Em desenvolvimento
npm run dev
```

O sistema agora valida automaticamente as variáveis de ambiente em `lib/env.ts`.

## 🔒 Segurança

**NUNCA** commite o arquivo `.env.local` no git!

O arquivo `.gitignore` já está configurado para ignorá-lo, mas sempre verifique antes de fazer commit.

## 🌐 Erro no Vercel (Produção)

Se você está vendo este erro no site publicado (Vercel):
```
Fetch failed loading: GET "https://maf-card-system.vercel.app/portal"
Error: An error occurred in the Server Components render
```

**Causa:** Variáveis de ambiente não configuradas no Vercel.

**Solução Rápida:** Veja [QUICK_FIX_VERCEL.md](QUICK_FIX_VERCEL.md)

**Guia Completo:** Veja [VERCEL_SETUP.md](VERCEL_SETUP.md)

**Resumo:**
1. Acesse Vercel Dashboard → Settings → Environment Variables
2. Adicione as 3 variáveis (URL, ANON_KEY, SERVICE_ROLE_KEY)
3. Marque todos os ambientes (Production, Preview, Development)
4. Faça redeploy do projeto

## 📚 Documentação Adicional

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase Setup](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
