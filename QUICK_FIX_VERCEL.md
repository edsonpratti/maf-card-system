# 🎯 AÇÃO IMEDIATA - Resolver Erro do Vercel

## O QUE ESTÁ ACONTECENDO

Seu site no Vercel (`https://maf-card-system.vercel.app`) está com erro porque **faltam as variáveis de ambiente**.

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### 1️⃣ Ir para Vercel
👉 https://vercel.com/dashboard

### 2️⃣ Abrir seu projeto
Clique em **maf-card-system**

### 3️⃣ Ir em Settings
**Settings** (ícone de engrenagem) → **Environment Variables**

### 4️⃣ Adicionar 3 variáveis

Clique em **Add New** e adicione CADA UMA:

```
Nome: NEXT_PUBLIC_SUPABASE_URL
Valor: [cole sua URL do Supabase]
Ambientes: ✅ Production ✅ Preview ✅ Development
```

```
Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor: [cole sua chave anon do Supabase]
Ambientes: ✅ Production ✅ Preview ✅ Development
```

```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: [cole sua service role key do Supabase]
Ambientes: ✅ Production ✅ Preview ✅ Development
```

### 5️⃣ Pegar as credenciais do Supabase

Se não tem as credenciais:
1. Abra https://app.supabase.com
2. Settings → API
3. Copie URL, anon key e service_role key

### 6️⃣ Fazer Redeploy

**IMPORTANTE:** As variáveis só funcionam após redeploy!

No Vercel:
- Vá em **Deployments**
- Clique nos **três pontinhos (...)** no último deployment
- Clique **Redeploy**
- Aguarde 2-3 minutos

---

## ✅ PRONTO!

Após o redeploy, acesse:
👉 https://maf-card-system.vercel.app

O erro deve estar corrigido! 🎉

---

## ❓ Ainda com erro?

Veja o guia completo: [VERCEL_SETUP.md](VERCEL_SETUP.md)
