# Recuperação de Senha com Resend

## 📧 Visão Geral

Sistema de recuperação de senha implementado usando **Resend** ao invés do Supabase Auth. Este sistema oferece:

- ✅ Emails profissionais personalizados
- ✅ Tokens seguros com expiração de 30 minutos
- ✅ Controle total sobre o fluxo de recuperação
- ✅ Melhor experiência do usuário

## 🚀 Como Funciona

### 1. Fluxo do Usuário

1. Usuária clica em "Esqueceu sua senha?" na página de login
2. Digita seu email cadastrado
3. Recebe email com link de recuperação (válido por 30 minutos)
4. Clica no link e é direcionada para página de redefinição
5. Define nova senha
6. É redirecionada para login

### 2. Fluxo Técnico

```
Login Form → solicitarRecuperacaoSenha()
    ↓
Gera token único (crypto.randomBytes)
    ↓
Salva na tabela password_reset_tokens
    ↓
Envia email via Resend
    ↓
Usuária clica no link
    ↓
/recuperar-senha/[token] valida token
    ↓
Usuária define nova senha
    ↓
redefinirSenha() atualiza senha no Supabase Auth
    ↓
Token marcado como usado
```

## 📦 Arquivos Criados/Modificados

### Novos Arquivos

1. **`app/actions/recuperar-senha.ts`**
   - `solicitarRecuperacaoSenha()` - Envia email de recuperação
   - `validarTokenRecuperacao()` - Valida se token é válido
   - `redefinirSenha()` - Atualiza senha no Supabase

2. **`app/recuperar-senha/[token]/page.tsx`**
   - Página de redefinição de senha
   - Validação de token
   - Formulário de nova senha

3. **`migrations/add-password-reset-tokens.sql`**
   - Tabela para armazenar tokens
   - Índices para performance
   - Políticas RLS

### Arquivos Modificados

1. **`lib/email-templates.ts`**
   - Novo template: `passwordResetEmailTemplate()`

2. **`components/login-form.tsx`**
   - Agora usa `solicitarRecuperacaoSenha()` ao invés de Supabase

## 🗄️ Estrutura do Banco

### Tabela: `password_reset_tokens`

```sql
id              UUID PRIMARY KEY
user_id         UUID (ref: auth.users)
email           TEXT
token           TEXT UNIQUE
expires_at      TIMESTAMPTZ
used            BOOLEAN
created_at      TIMESTAMPTZ
used_at         TIMESTAMPTZ
```

### Características

- Token único de 64 caracteres hexadecimais
- Expiração de 30 minutos
- Token só pode ser usado uma vez
- Índices para busca rápida

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Certifique-se que estas variáveis estão configuradas:

```bash
# Resend
RESEND_API_KEY=re_sua_chave_aqui
RESEND_FROM_EMAIL=onboarding@resend.dev

# Site URL (importante!)
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

### 2. Executar Migration

Execute a migration no Supabase SQL Editor:

```sql
-- Cole o conteúdo de migrations/add-password-reset-tokens.sql
```

Ou use a linha de comando:

```bash
supabase db reset
# ou
supabase migration up
```

### 3. Testar Localmente

```bash
# 1. Iniciar servidor
npm run dev

# 2. Acessar login
http://localhost:3000/login

# 3. Clicar em "Esqueceu sua senha?"

# 4. Digitar email cadastrado

# 5. Verificar email recebido

# 6. Clicar no link e redefinir senha
```

## 🔒 Segurança

### Proteções Implementadas

1. **Token Único**: 32 bytes aleatórios = 2^256 possibilidades
2. **Expiração**: 30 minutos de validade
3. **Uso Único**: Token invalidado após uso
4. **Email Oculto**: Mensagem genérica mesmo para emails não cadastrados
5. **RLS**: Apenas service role pode acessar tokens

### Validações

- Email deve existir no sistema (mas não informa se não existe)
- Token deve ser válido e não expirado
- Senha deve ter no mínimo 6 caracteres
- Confirmação de senha deve coincidir

## 📧 Template do Email

O email de recuperação inclui:

- Header com gradiente roxo/azul
- Nome personalizado da usuária
- Botão de CTA destacado
- Link alternativo para copiar/colar
- Aviso de expiração com data/hora formatada
- Dicas de segurança
- Footer profissional

## 🎨 Experiência do Usuário

### Mensagens de Feedback

✅ **Sucesso**
- "Email de recuperação enviado! Verifique sua caixa de entrada."
- "Senha redefinida com sucesso! Você já pode fazer login."

❌ **Erros**
- "Token inválido ou expirado."
- "As senhas não coincidem."
- "A senha deve ter no mínimo 6 caracteres."

### Estados da Interface

1. **Login Form**
   - Botão "Esqueceu sua senha?" visível
   - Formulário simples de email

2. **Página de Reset**
   - Loading durante validação do token
   - Mensagem de erro se token inválido
   - Formulário de nova senha se válido

3. **Após Redefinição**
   - Toast de sucesso
   - Redirecionamento automático para login em 2s

## 🧪 Testando

### Cenário 1: Fluxo Completo

```bash
1. Login → Esqueceu senha
2. Digite: aluna@example.com
3. Aguarde email
4. Clique no link
5. Digite nova senha
6. Confirme senha
7. Submeta
8. Aguarde redirecionamento
9. Faça login com nova senha
```

### Cenário 2: Token Expirado

```bash
1. Solicite recuperação
2. Aguarde 31 minutos
3. Tente usar link
4. Deve mostrar: "Token expirado"
```

### Cenário 3: Email Não Cadastrado

```bash
1. Digite email inexistente
2. Deve mostrar: "Se o email estiver cadastrado..."
3. Não revela se email existe (segurança)
```

## 🔧 Manutenção

### Limpar Tokens Expirados

Execute periodicamente para limpar tokens antigos:

```sql
-- Deletar tokens expirados há mais de 7 dias
DELETE FROM password_reset_tokens
WHERE expires_at < NOW() - INTERVAL '7 days';
```

### Monitorar Uso

```sql
-- Tokens criados hoje
SELECT COUNT(*) FROM password_reset_tokens
WHERE created_at::date = CURRENT_DATE;

-- Tokens usados com sucesso
SELECT COUNT(*) FROM password_reset_tokens
WHERE used = true;

-- Tokens expirados não usados
SELECT COUNT(*) FROM password_reset_tokens
WHERE used = false AND expires_at < NOW();
```

## 🚨 Troubleshooting

### Email não chega

1. Verificar logs do Resend: https://resend.com/logs
2. Conferir RESEND_API_KEY
3. Verificar RESEND_FROM_EMAIL
4. Checar se email está em spam

### Token inválido

1. Verificar se passou de 30 minutos
2. Confirmar que token não foi usado
3. Checar se tabela existe no Supabase
4. Verificar políticas RLS

### Erro ao redefinir senha

1. Confirmar SUPABASE_SERVICE_ROLE_KEY
2. Verificar se usuário existe no auth.users
3. Checar logs do servidor (console)

## 📊 Comparação: Resend vs Supabase Auth

| Aspecto | Resend | Supabase Auth |
|---------|--------|---------------|
| Template | ✅ Totalmente customizável | ❌ Limitado |
| Controle | ✅ Total | ⚠️ Parcial |
| Expiração | ✅ Configurável | ⚠️ Fixo (1 hora) |
| Tracking | ✅ Dashboard completo | ❌ Não |
| Limites | 3.000/mês grátis | ∞ (mas limitado) |
| Facilidade | ⚠️ Requer setup | ✅ Built-in |

## 🎯 Próximos Passos

- [ ] Configurar domínio personalizado no Resend
- [ ] Adicionar rate limiting (limitar tentativas)
- [ ] Criar job para limpar tokens expirados
- [ ] Adicionar logs de auditoria
- [ ] Implementar 2FA (futuro)

## 📝 Notas

- Tokens são gerados com `crypto.randomBytes(32)` do Node.js
- Cada token tem 64 caracteres hexadecimais
- URLs seguem padrão: `/recuperar-senha/[token]`
- Sistema funciona tanto local quanto em produção
- Emails enviados via Resend API
