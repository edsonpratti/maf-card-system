# ⚠️ ERRO AO ENVIAR EMAIL - CHECKLIST

## Problema Identificado
O email de primeiro acesso está falhando ao ser enviado.

## ✅ Checklist de Verificação

### 1. Variáveis de Ambiente na Vercel
Acesse: https://vercel.com/seu-projeto/settings/environment-variables

**Verifique se TODAS estas variáveis estão configuradas:**

```bash
RESEND_API_KEY=re_fWYUBVU7_Eqz7RStFyKK72gcnYdiYRoM2
RESEND_FROM_EMAIL=amanda@epxcred.com.br
NEXT_PUBLIC_SITE_URL=https://maf-card-system.vercel.app
```

**IMPORTANTE:**
- ✅ Marque para: Production, Preview, Development
- ✅ Clique em "Save" após adicionar cada uma
- ✅ Faça um novo deploy após salvar

### 2. Como Adicionar Variáveis na Vercel

**Opção 1: Via Dashboard**
1. Acesse https://vercel.com
2. Entre no projeto maf-card-system
3. Clique em "Settings"
4. Clique em "Environment Variables"
5. Adicione cada variável:
   - Name: `RESEND_API_KEY`
   - Value: `re_fWYUBVU7_Eqz7RStFyKK72gcnYdiYRoM2`
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Clique "Save"

**Opção 2: Via CLI (Mais Rápido)**
```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Adicionar variáveis
vercel env add RESEND_API_KEY production
# Digite: re_fWYUBVU7_Eqz7RStFyKK72gcnYdiYRoM2

vercel env add RESEND_FROM_EMAIL production
# Digite: onboarding@resend.dev

vercel env add NEXT_PUBLIC_SITE_URL production
# Digite: https://maf-card-system.vercel.app

# Fazer novo deploy
vercel --prod
```

### 3. Depois de Adicionar as Variáveis

**IMPORTANTE:** Após adicionar as variáveis, você DEVE fazer um novo deploy:

```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

Ou no dashboard da Vercel:
- Deployments → ⋯ (três pontos) → Redeploy

### 4. Verificar se Funcionou

Após o deploy, os logs vão mostrar:
```
✅ Email enviado com sucesso via Resend! ID: xxxxx
```

Se ainda aparecer erro, os logs detalhados vão mostrar exatamente qual é o problema.

---

## 🔍 Logs Adicionados

Agora o sistema vai mostrar logs detalhados em https://vercel.com/seu-projeto/logs:

- 📧 Iniciando envio de email
- 🔑 Token gerado
- ✅ Token salvo
- 🔗 Link gerado
- 📮 Tentando enviar via Resend
- 🔧 Configurações (mostra se API key está configurada)
- ✅ Sucesso OU ❌ Erro detalhado

---

## 🚨 Se Continuar com Erro

Copie os logs completos da Vercel e me envie para análise.
