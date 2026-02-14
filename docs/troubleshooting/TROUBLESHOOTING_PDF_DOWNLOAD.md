# 🔧 Correções do Erro de Download do PDF

## ⚠️ Problema Reportado
**Erro no Chrome**: "Falha - Erro de servidor desconhecido. Tente novamente ou entre em contato com o administrador do servidor."

## ✅ Correções Aplicadas

### 1. **Headers HTTP Melhorados**
- ✅ Adicionado `Content-Length` 
- ✅ Adicionado `status: 200` explícito
- ✅ Adicionados headers de cache control
- ✅ Sanitização do nome do arquivo (remove caracteres especiais)

### 2. **Tratamento de Erros Robusto**
- ✅ Try-catch na geração do PDF
- ✅ Try-catch específico para QR Code
- ✅ Logs detalhados com stack trace
- ✅ Mensagens de erro mais descritivas

### 3. **Compatibilidade com Vercel**
- ✅ Removido uso de `require('crypto')` (incompatível com Edge Runtime)
- ✅ Substituído por geração de tokens com `Math.random()`
- ✅ Fallback para URL base caso `NEXT_PUBLIC_APP_URL` não esteja definida

### 4. **QR Code Otimizado**
- ✅ Adicionado `errorCorrectionLevel: 'M'`
- ✅ Explicitamente definido `type: 'png'`
- ✅ Tratamento de erro: continua mesmo se QR falhar

### 5. **Rota de Diagnóstico**
- ✅ Criada `/api/debug/pdf-deps` para testar dependências

## 🚀 Como Testar

### 1. **Deploy no Vercel**
```bash
git add .
git commit -m "fix: corrigir erro de download do PDF"
git push
```

### 2. **Verificar Dependências**
Acesse: `https://maf-card-system.vercel.app/api/debug/pdf-deps`

Deve retornar:
```json
{
  "status": "ok",
  "environment": {
    "nodeEnv": "production",
    "hasAppUrl": true,
    "runtime": "vercel"
  },
  "dependencies": {
    "pdfLib": true,
    "qrcode": true,
    "buffer": true
  }
}
```

### 3. **Verificar Logs no Vercel**
1. Acesse o Dashboard do Vercel
2. Vá em "Logs" ou "Runtime Logs"
3. Tente baixar o PDF novamente
4. Verifique se há erros no console

### 4. **Testar Localmente**
```bash
npm run dev
# Acesse http://localhost:3000
# Faça login e tente baixar o PDF
```

## 🔍 Possíveis Causas Restantes

Se o erro persistir, pode ser:

### A) **Variável de Ambiente Faltando**
No Vercel, verifique se `NEXT_PUBLIC_APP_URL` está configurada:
- Vá em Settings → Environment Variables
- Adicione: `NEXT_PUBLIC_APP_URL = https://maf-card-system.vercel.app`

### B) **Timeout no Vercel**
- Função está demorando muito (max 10s no plano free)
- Solução: Reduzir `gradientSteps` de 50 para 20

### C) **Memória Insuficiente**
- PDF muito grande
- Solução: Otimizar tamanho do QR Code

### D) **CORS Issues**
- Verificar se há bloqueio de download
- Testar em navegador anônimo

## 📋 Checklist de Debug

- [ ] Variável `NEXT_PUBLIC_APP_URL` configurada no Vercel
- [ ] Deploy bem-sucedido sem erros de build
- [ ] Rota `/api/debug/pdf-deps` retorna status ok
- [ ] Logs do Vercel não mostram erros 500
- [ ] Testado em navegador anônimo
- [ ] Testado em outro navegador (Firefox, Safari)
- [ ] Usuário está autenticado corretamente
- [ ] Cartão está com status aprovado
- [ ] `card_number` e `validation_token` existem no banco

## 🛠️ Solução Temporária (Se Necessário)

Criar versão simplificada sem QR Code:

```typescript
// Em lib/pdf-generator.ts, remover seção do QR Code
// e retornar PDF básico apenas com texto
```

## 📞 Próximos Passos

1. Fazer deploy das correções
2. Testar download do PDF
3. Verificar logs do Vercel
4. Se persistir, aplicar solução temporária
5. Investigar causa específica com logs detalhados
