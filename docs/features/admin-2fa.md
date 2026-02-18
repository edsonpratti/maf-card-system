# Autenticação de Dois Fatores (2FA) para Administradores

## 📋 Visão Geral

Sistema de autenticação de dois fatores (2FA) obrigatório para todos os administradores do MAF Card System. Quando um administrador tenta fazer login, ele deve validar seu acesso através de um código de 6 dígitos enviado para seu email.

## 🔐 Como Funciona

### Fluxo de Login do Administrador

1. **Login Inicial**: Admin insere email e senha em `/admin/login`
2. **Validação de Credenciais**: Sistema valida email e senha
3. **Geração de Código**: Sistema gera código de 6 dígitos e envia por email
4. **Logout Temporário**: Admin é deslogado temporariamente
5. **Validação 2FA**: Admin é redirecionado para `/admin/verify-2fa`
6. **Inserção do Código**: Admin insere o código recebido por email
7. **Login Completo**: Após validação, login é completado e admin acessa o dashboard

### Características de Segurança

- ✅ **Código Único**: Cada código só pode ser usado uma vez
- ⏱️ **Expiração**: Códigos expiram em 10 minutos
- 🔒 **Credenciais Temporárias**: Armazenadas apenas no sessionStorage por 15 minutos
- 📧 **Email Obrigatório**: Código enviado apenas para email cadastrado
- 🚫 **Proteção Contra Reutilização**: Códigos usados são marcados como inválidos

## 📁 Arquivos Criados/Modificados

### 1. Migration: `migrations/add-admin-2fa.sql`
- Cria tabela `admin_2fa_codes`
- Define índices para performance
- Configura políticas RLS
- Adiciona função para limpar códigos expirados

### 2. Actions: `app/actions/admin-2fa.ts`
Funções principais:
- `generateAndSend2FACode(email)`: Gera e envia código por email
- `validate2FACode(email, code)`: Valida código e marca como usado
- `validate2FACodeAndLogin(email, code, password)`: Valida e completa login

### 3. Template de Email: `lib/email-templates-admin.ts`
Nova função:
- `admin2FACodeEmailTemplate(name, code)`: Template HTML para email do código

### 4. Página de Verificação: `app/admin/verify-2fa/page.tsx`
Interface para inserção do código 2FA com:
- Campo de entrada formatado para 6 dígitos
- Opção para reenviar código
- Timer de expiração
- Mensagens de segurança

### 5. Componente de Login: `components/login-form.tsx`
Modificações:
- Detecta login de admin
- Envia código 2FA após validar credenciais
- Armazena credenciais temporariamente
- Redireciona para página de verificação

## 🗄️ Estrutura do Banco de Dados

### Tabela: `admin_2fa_codes`

```sql
CREATE TABLE admin_2fa_codes (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT
);
```

**Índices:**
- `idx_admin_2fa_codes_email`
- `idx_admin_2fa_codes_code`
- `idx_admin_2fa_codes_expires_at`

## 🚀 Instalação

### 1. Executar Migration

Execute o arquivo de migration no Supabase SQL Editor:

```bash
# Copie o conteúdo de migrations/add-admin-2fa.sql
# Cole no Supabase SQL Editor
# Execute a query
```

Ou via CLI:

```bash
supabase db push
```

### 2. Verificar Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=mafpro@amandafernandes.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxx
```

### 3. Testar o Fluxo

1. Acesse `/admin/login`
2. Faça login com credenciais de admin
3. Verifique se recebeu o email com o código
4. Insira o código na página de verificação
5. Confirme acesso ao dashboard

## 📧 Template do Email

O email enviado contém:
- Código de 6 dígitos destacado
- Informações sobre expiração (10 minutos)
- Aviso de segurança
- Alerta caso não reconheça a tentativa de login

## 🔧 Manutenção

### Limpar Códigos Expirados

Execute periodicamente (via cron job ou Supabase Functions):

```sql
SELECT clean_expired_2fa_codes();
```

### Monitorar Tentativas

Query para verificar tentativas de 2FA:

```sql
SELECT 
    email,
    code,
    created_at,
    expires_at,
    used,
    used_at
FROM admin_2fa_codes
ORDER BY created_at DESC
LIMIT 20;
```

### Verificar Códigos Não Utilizados

```sql
SELECT 
    email,
    COUNT(*) as tentativas
FROM admin_2fa_codes
WHERE used = false AND expires_at < NOW()
GROUP BY email
ORDER BY tentativas DESC;
```

## ⚠️ Considerações de Segurança

### SessionStorage vs Cookie
- **Atual**: Credenciais armazenadas no `sessionStorage` por 15 minutos
- **Alternativa**: Implementar tokens JWT server-side para maior segurança
- **Razão**: SessionStorage é mais simples mas menos seguro que cookies httpOnly

### Rate Limiting
Considere implementar rate limiting para:
- Tentativas de validação de código
- Solicitações de reenvio de código
- Tentativas de login

### Logging e Auditoria
Adicione logs para:
- Códigos gerados
- Códigos validados
- Tentativas falhas
- IPs e user agents

## 🐛 Troubleshooting

### Código não chegou no email
1. Verifique configuração do Resend
2. Confira spam/lixo eletrônico
3. Valide `RESEND_API_KEY` e `RESEND_FROM_EMAIL`

### Código inválido ou expirado
1. Verifique se passou 10 minutos desde geração
2. Confirme que código não foi usado anteriormente
3. Solicite novo código

### Erro ao fazer login após 2FA
1. Limpe sessionStorage do navegador
2. Tente fazer login novamente desde o início
3. Verifique logs do console para erros

### Sessão expirada
- SessionStorage expira em 15 minutos
- Se demorar muito para inserir código, faça login novamente

## 📝 Melhorias Futuras

- [ ] Implementar rate limiting
- [ ] Adicionar opção de "confiar neste dispositivo" (30 dias)
- [ ] Suporte para autenticação via SMS
- [ ] Backup codes para recuperação
- [ ] Logs de auditoria detalhados
- [ ] Dashboard de segurança para admins
- [ ] Notificações de login suspeito
- [ ] Suporte para apps de autenticação (TOTP)

## 🔗 Links Úteis

- [Resend Documentation](https://resend.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [2FA Best Practices](https://auth0.com/docs/secure/multi-factor-authentication)

---

**Última atualização**: 18/02/2026  
**Versão**: 1.0.0
