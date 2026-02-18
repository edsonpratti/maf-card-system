# Configuração de Domínio em Produção

## Problema Identificado

O sistema estava sendo redirecionado em alguns momentos para o domínio padrão do Vercel (`maf-card-system.vercel.app`) em vez do domínio de produção correto (`mafpro.amandafernandes.com`).

## Causa

A aplicação usa a variável de ambiente `NEXT_PUBLIC_APP_URL` para construir URLs absolutas (emails, QR codes, etc.), mas:

1. **Fallbacks hardcoded**: O código tinha fallbacks para o domínio do Vercel quando a variável não estava definida
2. **Variável não configurada**: A variável `NEXT_PUBLIC_APP_URL` pode não estar configurada no Vercel

## Solução Aplicada

### 1. Código Atualizado

Todos os fallbacks foram atualizados para usar o domínio de produção:

```typescript
// Antes
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maf-card-system.vercel.app'

// Depois
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mafpro.amandafernandes.com'
```

**Arquivos atualizados:**
- `lib/pdf-generator.ts` (2 ocorrências)
- `lib/email-templates.ts`
- `app/actions/first-access.ts`
- `app/actions/recuperar-senha.ts`
- `app/actions/admin.ts` (2 ocorrências)

### 2. Variável Padronizada

O sistema agora usa exclusivamente `NEXT_PUBLIC_APP_URL` (antes havia inconsistências com `NEXT_PUBLIC_SITE_URL`).

## Configuração no Vercel

### Passo 1: Acessar o Dashboard do Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Entre no projeto **maf-card-system**
3. Vá em **Settings** → **Environment Variables**

### Passo 2: Adicionar/Atualizar a Variável

**Nome da Variável:**
```
NEXT_PUBLIC_APP_URL
```

**Valor:**
```
https://mafpro.amandafernandes.com
```

**Ambientes:**
- ✅ Production
- ✅ Preview
- ⚠️ Development (opcional, use `http://localhost:3000` localmente)

### Passo 3: Fazer Redeploy

Após adicionar/atualizar a variável, é necessário fazer um novo deploy:

1. Vá em **Deployments**
2. Clique no último deployment
3. Clique em **⋯ (três pontos)** → **Redeploy**
4. Confirme o redeploy

## Verificação

### 1. Verificar Variável no Build

Acesse o log do último deployment e procure por:
```
NEXT_PUBLIC_APP_URL: https://mafpro.amandafernandes.com
```

### 2. Testar Funcionalidades

Teste as seguintes funcionalidades que usam a URL base:

- ✅ **QR Code na carteirinha**: Escanear e verificar se aponta para `mafpro.amandafernandes.com/validar/...`
- ✅ **Links em emails**: Verificar se os botões nos emails apontam para o domínio correto
- ✅ **Primeiro acesso**: Link de primeiro acesso deve usar o domínio correto
- ✅ **Recuperação de senha**: Link de reset deve usar o domínio correto
- ✅ **Download de carteirinha**: Link no email deve usar o domínio correto

### 3. Inspecionar no Console do Navegador

Abra o Developer Tools (F12) e na aba **Console**, digite:
```javascript
console.log(process.env.NEXT_PUBLIC_APP_URL)
```

Deve retornar: `https://mafpro.amandafernandes.com`

## Domínio Customizado no Vercel

### Verificar Configuração do Domínio

1. Vá em **Settings** → **Domains**
2. Verifique se `mafpro.amandafernandes.com` está:
   - ✅ Adicionado
   - ✅ Configurado como domínio principal (Primary Domain)
   - ✅ SSL ativo

### DNS Records

Certifique-se de que os registros DNS estão corretos:

**Registro A:**
```
Type: A
Name: @ (ou mafpro)
Value: 76.76.21.21 (IP do Vercel)
TTL: 3600
```

**Registro CNAME:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

## Prevenção de Futuros Problemas

### 1. Nunca Use URLs Hardcoded

❌ **Errado:**
```typescript
const link = 'https://maf-card-system.vercel.app/portal'
```

✅ **Correto:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mafpro.amandafernandes.com'
const link = `${baseUrl}/portal`
```

### 2. Use URLs Relativas Quando Possível

Para navegação interna, use URLs relativas:

```typescript
// Links internos (Next.js Link)
<Link href="/portal">Portal</Link>

// Redirecionamentos
router.push('/portal')
```

### 3. Configure .env.example

Adicione ao `.env.example` para documentar:
```bash
# URL base da aplicação (usar domínio de produção)
NEXT_PUBLIC_APP_URL=https://mafpro.amandafernandes.com
```

## Checklist Final

- [ ] Variável `NEXT_PUBLIC_APP_URL` configurada no Vercel
- [ ] Domínio `mafpro.amandafernandes.com` configurado como Primary Domain
- [ ] SSL ativo no domínio customizado
- [ ] Redeploy realizado após configuração
- [ ] QR Code testado (aponta para domínio correto)
- [ ] Links de email testados
- [ ] Nenhum redirecionamento para `vercel.app`

## Suporte

Se o problema persistir após seguir este guia:

1. Verifique os logs do Vercel
2. Confirme que o redeploy foi feito
3. Limpe o cache do navegador
4. Verifique se há outros domínios configurados no projeto
