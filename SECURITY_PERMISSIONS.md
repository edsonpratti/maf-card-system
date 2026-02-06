# Verificação de Permissões - Server Actions

## Resumo das Proteções Implementadas

Este documento descreve as verificações de permissões e segurança implementadas em todas as Server Actions do sistema MAF Card.

## 1. Verificação de Permissões de Admin

### Arquivo: `lib/auth.ts`

Criado módulo centralizado com funções de autenticação e autorização:

- **`verifyAdminAccess()`**: Verifica se o usuário atual é admin e lança erro se não for
- **`getCurrentUser()`**: Obtém o usuário atual sem verificar permissões
- **`isAdmin()`**: Verifica se o usuário é admin (retorna boolean)

### Server Actions Protegidas

#### `app/actions/admin.ts` (Ações Administrativas)
Todas as ações agora verificam permissões de admin antes de executar:

1. **`getRequests()`** - Listar solicitações
   - ✅ Verificação de admin adicionada
   
2. **`updateRequestStatus()`** - Atualizar status de solicitação
   - ✅ Verificação de admin adicionada
   - ✅ Registro de auditoria com ID do admin
   
3. **`deleteRequest()`** - Deletar solicitação
   - ✅ Verificação de admin adicionada
   
4. **`getDashboardStats()`** - Obter estatísticas do dashboard
   - ✅ Verificação de admin adicionada

5. **`adminLogout()`** - Logout do admin
   - Sem necessidade de verificação (já é ação de logout)

6. **`getCurrentAdmin()`** - Obter admin atual
   - Sem necessidade de verificação (apenas retorna dados)

#### `app/actions/base-alunas.ts` (Gestão da Base de Alunas)
Todas as ações agora verificam permissões de admin:

1. **`addStudent()`** - Adicionar aluna
   - ✅ Verificação de admin adicionada
   
2. **`importCSV()`** - Importar CSV de alunas
   - ✅ Verificação de admin adicionada
   
3. **`deleteStudent()`** - Deletar aluna
   - ✅ Verificação de admin adicionada

## 2. Proteções em Ações Públicas

### `app/actions/solicitar.ts` (Solicitações Públicas)

#### Rate Limiting
Implementado sistema de rate limiting simples para prevenir abusos:

- **`checkCPFExists()`**
  - ✅ Limite: 5 verificações por minuto por CPF
  - ✅ Validação de CPF antes de consultar banco
  
- **`submitApplication()`**
  - ✅ Limite: 3 submissões por hora por CPF
  - ✅ Validação de campos obrigatórios
  - ✅ Validação de CPF
  - ✅ Validação de tamanho de arquivo (máx 5MB)

> **Nota**: Para produção, considere migrar o rate limiting para Redis ou similar para suportar múltiplas instâncias da aplicação.

## 3. Camadas de Segurança

### Camada 1: Middleware
O arquivo `middleware.ts` já protege rotas `/admin/*`:
- Verifica autenticação
- Verifica role de admin
- Redireciona não autorizados

### Camada 2: Server Actions
Verificação adicional em cada action:
- Valida permissões mesmo se o middleware for burlado
- Registra ações para auditoria
- Previne acesso direto via API

### Camada 3: Database (RLS - Row Level Security)
Configurado no Supabase via migrations:
- Políticas de segurança em nível de banco de dados
- Última linha de defesa

## 4. Auditoria

### Log de Ações Administrativas
A ação `updateRequestStatus()` agora registra:
- ID do admin que executou a ação
- Tipo de ação realizada
- ID do usuário afetado
- Metadados adicionais (ex: motivo de rejeição)

## 5. Tratamento de Erros

Todas as verificações de permissão lançam erros descritivos:
- `"Unauthorized: Authentication required"` - Usuário não autenticado
- `"Forbidden: Admin access required"` - Usuário autenticado mas não é admin

Estes erros podem ser capturados no frontend para exibir mensagens apropriadas.

## 6. Boas Práticas Implementadas

✅ **Validação em múltiplas camadas** (defense in depth)  
✅ **Centralização de lógica de autenticação** (DRY principle)  
✅ **Rate limiting** para prevenir abuso  
✅ **Validação de entrada** em todas as actions públicas  
✅ **Registro de auditoria** para ações sensíveis  
✅ **Mensagens de erro apropriadas** sem expor detalhes do sistema  

## 7. Próximos Passos Recomendados

Para melhorar ainda mais a segurança:

1. **Rate Limiting Distribuído**: Migrar para Redis/Upstash
2. **CSRF Protection**: Implementar tokens CSRF para forms
3. **Input Sanitization**: Adicionar sanitização HTML/SQL mais rigorosa
4. **Monitoring**: Adicionar alertas para tentativas de acesso não autorizado
5. **2FA**: Considerar autenticação de dois fatores para admins
6. **Session Management**: Implementar timeout de sessão e renovação de tokens
7. **IP Whitelisting**: Considerar whitelist de IPs para acesso admin (opcional)

## 8. Testes de Segurança

Recomenda-se testar os seguintes cenários:

- [ ] Acesso a actions admin sem autenticação
- [ ] Acesso a actions admin com usuário não-admin
- [ ] Rate limiting em checkCPFExists
- [ ] Rate limiting em submitApplication
- [ ] Upload de arquivo muito grande
- [ ] CPF inválido em todas as actions que usam CPF
- [ ] SQL injection em campos de texto
- [ ] XSS em campos de texto

---

**Data de Implementação**: 6 de fevereiro de 2026  
**Arquivos Modificados**:
- `lib/auth.ts` (criado)
- `app/actions/admin.ts` (modificado)
- `app/actions/base-alunas.ts` (modificado)
- `app/actions/solicitar.ts` (modificado)
