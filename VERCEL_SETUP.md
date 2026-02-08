# 🚀 Configuração de Variáveis de Ambiente no Vercel

## ❌ Erro Atual

Você está vendo este erro no Vercel:
```
Fetch failed loading: GET "https://maf-card-system.vercel.app/portal?_rsc=3151w"
Error: An error occurred in the Server Components render
```

**Causa:** As variáveis de ambiente não estão configuradas no Vercel.

---

## ✅ Solução: Configurar Variáveis no Vercel

### Passo 1: Acessar o Dashboard do Vercel

1. Acesse https://vercel.com
2. Entre no projeto **maf-card-system**
3. Clique em **Settings** (⚙️)
4. No menu lateral, clique em **Environment Variables**

### Passo 2: Adicionar as Variáveis

Adicione **CADA UMA** das seguintes variáveis:

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Sua URL do Supabase (exemplo: `https://abc123.supabase.co`)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Clique em **Save**

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Sua chave anônima do Supabase
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Clique em **Save**

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** Sua chave service role do Supabase ⚠️ **SENSÍVEL**
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Clique em **Save**

### Passo 3: Obter as Credenciais do Supabase

Se você não tem essas credenciais:

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **URL** → Use em `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → Use em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → Use em `SUPABASE_SERVICE_ROLE_KEY`

### Passo 4: Fazer Redeploy

Após adicionar as variáveis, você DEVE fazer redeploy:

**Opção A - Pelo Dashboard:**
1. Vá em **Deployments**
2. Clique nos **três pontinhos (...)** no último deployment
3. Clique em **Redeploy**
4. Confirme **Redeploy**

**Opção B - Pelo Git:**
```bash
git commit --allow-empty -m "Trigger redeploy after env vars"
git push
```

---

## 📋 Checklist

- [ ] Acessei o Vercel Dashboard
- [ ] Adicionei `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Adicionei `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Adicionei `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Marquei todos os ambientes (Production, Preview, Development)
- [ ] Fiz redeploy da aplicação
- [ ] Aguardei o build completar (2-3 minutos)
- [ ] Testei o site novamente

---

## 🔍 Como Verificar se Funcionou

Após o redeploy:

1. Acesse https://maf-card-system.vercel.app
2. Faça login
3. Tente acessar `/portal`
4. **Deve funcionar** sem erros de "Server Components render"

---

## ⚠️ Erros Comuns

### Erro: "Variáveis não surtiram efeito"
**Solução:** Você esqueceu de fazer redeploy. As variáveis só são aplicadas após um novo build.

### Erro: "Still getting Server Component error"
**Solução:** 
1. Verifique se as 3 variáveis estão corretas (sem espaços extras)
2. Confirme que marcou todos os ambientes
3. Aguarde o build completar totalmente
4. Limpe o cache do browser (Ctrl+Shift+Delete)

### Erro: "Cannot read environment variable"
**Solução:** Os nomes devem ser EXATAMENTE como mostrado (case-sensitive):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ❌ `next_public_supabase_url`
- ❌ `SUPABASE_URL`

---

## 📸 Screenshot de Referência

Suas variáveis no Vercel devem parecer assim:

```
NEXT_PUBLIC_SUPABASE_URL          https://abc...  Production, Preview, Dev
NEXT_PUBLIC_SUPABASE_ANON_KEY     eyJhbG...       Production, Preview, Dev
SUPABASE_SERVICE_ROLE_KEY         eyJhbG...       Production, Preview, Dev
```

---

## 🔒 Segurança

- A chave `SUPABASE_SERVICE_ROLE_KEY` é **EXTREMAMENTE SENSÍVEL**
- NUNCA compartilhe essa chave publicamente
- Ela permite acesso total ao seu banco de dados
- Guarde-a como uma senha

---

## 📚 Links Úteis

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Supabase with Vercel](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
