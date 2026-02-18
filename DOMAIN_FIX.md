# ✅ Correção Aplicada: Redirecionamento para Domínio do Vercel

## 🔴 Problema Identificado

O sistema em produção no domínio `mafpro.amandafernandes.com` estava sendo redirecionado em alguns momentos para `maf-card-system.vercel.app`.

## 🔍 Causa Raiz

1. **Fallbacks hardcoded**: O código tinha valores padrão (`https://maf-card-system.vercel.app`) quando a variável de ambiente `NEXT_PUBLIC_APP_URL` não estava definida
2. **Variável não configurada**: A variável `NEXT_PUBLIC_APP_URL` pode não estar configurada no ambiente de produção do Vercel
3. **Inconsistência**: O código usava tanto `NEXT_PUBLIC_APP_URL` quanto `NEXT_PUBLIC_SITE_URL`

## ✅ Correções Aplicadas

### 1. Código Atualizado

Todos os arquivos foram atualizados para usar o domínio de produção correto como fallback:

**Arquivos modificados:**
- ✅ [lib/pdf-generator.ts](lib/pdf-generator.ts) - 2 ocorrências (QR codes)
- ✅ [lib/email-templates.ts](lib/email-templates.ts) - 1 ocorrência (botão de email)
- ✅ [app/actions/first-access.ts](app/actions/first-access.ts) - 1 ocorrência (link de primeiro acesso)
- ✅ [app/actions/recuperar-senha.ts](app/actions/recuperar-senha.ts) - 1 ocorrência (link de recuperação)
- ✅ [app/actions/admin.ts](app/actions/admin.ts) - 2 ocorrências (links de email)

**Mudança aplicada em todos:**
```typescript
// ❌ ANTES
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maf-card-system.vercel.app'
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// ✅ DEPOIS
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mafpro.amandafernandes.com'
```

### 2. Documentação Criada

- ✅ [docs/setup/DOMAIN_CONFIGURATION.md](docs/setup/DOMAIN_CONFIGURATION.md) - Guia completo de configuração
- ✅ [.env.example](.env.example) - Atualizado com a variável correta

### 3. README Atualizado

- ✅ [README.md](README.md) - Adicionado aviso sobre configuração do domínio

## 🚀 Próximos Passos - AÇÃO NECESSÁRIA

### 1. Verificar Variável no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Entre no projeto **maf-card-system**
3. Vá em **Settings** → **Environment Variables**
4. Verifique se existe a variável `NEXT_PUBLIC_APP_URL`

### 2. Adicionar/Atualizar a Variável

**Se a variável NÃO existir ou estiver incorreta:**

**Nome:**
```
NEXT_PUBLIC_APP_URL
```

**Valor:**
```
https://mafpro.amandafernandes.com
```

**Ambientes selecionados:**
- ✅ Production
- ✅ Preview

### 3. Fazer Redeploy

**IMPORTANTE**: Após adicionar/atualizar a variável, é obrigatório fazer um novo deploy:

1. Vá em **Deployments**
2. Clique no último deployment (o mais recente)
3. Clique em **⋯ (três pontos)** no canto superior direito
4. Selecione **Redeploy**
5. Marque **Use existing Build Cache** (opcional, para deploy mais rápido)
6. Clique em **Redeploy**

### 4. Verificar se o Deploy Funcionou

Após o redeploy:

1. **Verificar nos Logs do Build:**
   - Abra o deployment
   - Vá na aba **Building**
   - Procure por menções a `NEXT_PUBLIC_APP_URL`

2. **Testar no Browser:**
   - Abra o console do navegador (F12)
   - Digite: `console.log(process.env.NEXT_PUBLIC_APP_URL)`
   - Deve retornar: `"https://mafpro.amandafernandes.com"`

3. **Testar Funcionalidades:**
   - ✅ Gerar uma carteirinha e verificar o QR Code
   - ✅ Escanear o QR Code (deve abrir `mafpro.amandafernandes.com/validar/...`)
   - ✅ Enviar um email e verificar os links
   - ✅ Testar primeiro acesso
   - ✅ Testar recuperação de senha

## 📋 Checklist de Verificação

- [ ] Variável `NEXT_PUBLIC_APP_URL` configurada no Vercel
- [ ] Valor da variável é `https://mafpro.amandafernandes.com`
- [ ] Variável configurada para **Production** e **Preview**
- [ ] Redeploy realizado após adicionar/atualizar variável
- [ ] QR Code testado e aponta para domínio correto
- [ ] Links de email testados
- [ ] Não há mais redirecionamentos para `vercel.app`

## 🔐 Verificar Domínio Customizado

Também é importante verificar se o domínio está configurado corretamente no Vercel:

1. Vá em **Settings** → **Domains**
2. Verifique se `mafpro.amandafernandes.com` está:
   - ✅ Adicionado à lista
   - ✅ Marcado como **Primary** (domínio principal)
   - ✅ Com SSL ativo (HTTPS)

Se não estiver configurado como Primary, clique em **Set as Primary**.

## 📚 Documentação Adicional

Para mais detalhes, consulte:
- [docs/setup/DOMAIN_CONFIGURATION.md](docs/setup/DOMAIN_CONFIGURATION.md) - Guia completo de configuração de domínio
- [.env.example](.env.example) - Exemplo de variáveis de ambiente

## ⚠️ Importante

Esta correção resolve o problema do código, mas **é essencial configurar a variável de ambiente no Vercel** e fazer o redeploy. Sem isso, o sistema continuará usando o fallback (que agora aponta para o domínio correto, mas é melhor ter a variável configurada).

## 🆘 Suporte

Se após seguir todos os passos o problema persistir:

1. Verifique os logs do deployment no Vercel
2. Confirme que o redeploy foi concluído com sucesso
3. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
4. Teste em uma aba anônima
5. Verifique se não há outros domínios configurados no projeto

---

**Status**: ✅ Código corrigido | ⏳ Aguardando configuração no Vercel e redeploy
