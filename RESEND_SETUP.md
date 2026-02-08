# Configuração do Resend para Envio de Emails

## 📧 O que foi implementado

O sistema agora usa **Resend** para enviar emails profissionais de primeiro acesso quando uma carteirinha é aprovada.

## 🚀 Como Configurar

### 1. Criar Conta no Resend

1. Acesse: https://resend.com/signup
2. Crie uma conta gratuita (3.000 emails/mês)
3. Confirme seu email

### 2. Obter API Key

1. Acesse: https://resend.com/api-keys
2. Clique em **"Create API Key"**
3. Nome: `MAF Card System`
4. Permissão: **"Sending access"**
5. Copie a chave que começa com `re_...`

### 3. Configurar Variáveis de Ambiente

Edite seu arquivo `.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=re_sua_chave_aqui
RESEND_FROM_EMAIL=onboarding@resend.dev

# Site Configuration (importante!)
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

**Notas:**
- Use `onboarding@resend.dev` para testes (funciona imediatamente)
- Para produção, configure seu próprio domínio (veja abaixo)

### 4. (Opcional) Configurar Domínio Personalizado

Para usar emails como `noreply@seudominio.com`:

1. Acesse: https://resend.com/domains
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `mafcards.com`)
4. Adicione os registros DNS fornecidos:
   - **SPF**: TXT record
   - **DKIM**: TXT record
   - **DMARC**: TXT record (opcional)
5. Aguarde verificação (pode levar até 72h)
6. Atualize `.env.local`:
   ```bash
   RESEND_FROM_EMAIL=noreply@seudominio.com
   ```

## 🎨 Template de Email

O email enviado inclui:

✅ Design moderno e responsivo  
✅ Botão CTA destacado  
✅ Link alternativo para copiar/colar  
✅ Aviso de expiração (48 horas)  
✅ Dicas de segurança  
✅ Branding personalizado  

**Localização do template:** `lib/email-templates.ts`

## 🧪 Testando

### Modo Desenvolvimento (sem Resend configurado)

Se `RESEND_API_KEY` não estiver definida:
- Link aparece no **console/terminal**
- Nenhum email é enviado
- Útil para desenvolvimento local

### Modo Produção (com Resend)

1. Configure as variáveis de ambiente
2. Reinicie o servidor: `npm run dev`
3. Teste aprovando uma carteirinha
4. Verifique o email recebido
5. Monitore logs: https://resend.com/emails

## 📊 Monitoramento

Acesse https://resend.com/emails para ver:
- Emails enviados
- Status de entrega (delivered, bounced, complained)
- Logs detalhados
- Analytics

## 🔧 Troubleshooting

### Email não chega

1. **Verifique a caixa de spam**
2. **Confirme API Key**: `RESEND_API_KEY` está correta?
3. **Verifique logs**: Console do servidor ou Resend Dashboard
4. **Email válido**: Resend só envia para emails reais em produção

### Erro: "RESEND_API_KEY is not defined"

Adicione a variável em `.env.local` e reinicie o servidor.

### Domínio não verificado

- Aguarde até 72h para propagação DNS
- Use `onboarding@resend.dev` enquanto isso
- Verifique registros DNS: https://mxtoolbox.com/

## 💰 Limites do Plano Gratuito

- **3.000 emails/mês**
- **100 emails/dia**
- Emails ilimitados para domínios verificados

Para mais, veja: https://resend.com/pricing

## 🔐 Segurança

- ✅ API Key armazenada em variável de ambiente
- ✅ Tokens únicos com expiração
- ✅ Links válidos por apenas 48h
- ✅ HTTPS obrigatório em produção

## 📝 Personalização do Email

Edite o template em `lib/email-templates.ts`:

```typescript
export function firstAccessEmailTemplate(name: string, accessLink: string, expiresAt: Date) {
  // Customize o HTML aqui
}
```

## 🚀 Deploy (Vercel)

Adicione as variáveis de ambiente no Vercel:

```bash
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
vercel env add NEXT_PUBLIC_SITE_URL
```

Ou via dashboard: https://vercel.com/[seu-projeto]/settings/environment-variables

---

**Pronto!** 🎉 Agora seu sistema envia emails profissionais automaticamente.
