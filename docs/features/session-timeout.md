# Sistema de Timeout de Sessão

## Visão Geral

O sistema implementa timeout automático de sessão para proteger contas de usuários contra acesso não autorizado em casos de inatividade prolongada.

## Funcionalidades

### Monitoramento de Atividade
O sistema monitora os seguintes eventos para detectar atividade do usuário:
- Movimento do mouse (`mousemove`)
- Cliques do mouse (`mousedown`, `click`)
- Teclas pressionadas (`keypress`)
- Rolagem da página (`scroll`)
- Toques na tela (dispositivos móveis) (`touchstart`)

### Tempos Configuráveis

#### Usuários do Portal (Comum)
- **Tempo de aviso**: 25 minutos de inatividade
- **Tempo de logout**: 30 minutos de inatividade
- **Redirecionamento**: `/login`

#### Usuários Admin
- **Tempo de aviso**: 25 minutos de inatividade
- **Tempo de logout**: 30 minutos de inatividade
- **Redirecionamento**: `/admin/login`

### Fluxo de Funcionamento

1. **Atividade Normal**: Os timers são resetados a cada ação do usuário
2. **Aviso de Inatividade**: Após 25 minutos sem atividade, um modal é exibido
3. **Opções no Modal**:
   - **Continuar Conectado**: Reseta os timers e mantém a sessão ativa
   - **Sair Agora**: Faz logout imediatamente
4. **Logout Automático**: Se nenhuma ação for tomada, o logout ocorre aos 30 minutos

### Otimizações

#### Throttling
Para evitar resets muito frequentes dos timers, foi implementado um throttling que limita os resets a no máximo 1 vez por segundo, independentemente de quantos eventos de atividade ocorram.

## Implementação

### Componente Principal
[components/session-timeout.tsx](../components/session-timeout.tsx)

### Integração

O componente `SessionTimeout` foi integrado em:

1. **Portal do Usuário**: [app/portal/layout.tsx](../app/portal/layout.tsx)
   ```tsx
   <SessionTimeout warningTime={25} logoutTime={30} redirectTo="/login" />
   ```

2. **Dashboard Admin**: [components/admin/dashboard-shell.tsx](../components/admin/dashboard-shell.tsx)
   ```tsx
   <SessionTimeout warningTime={25} logoutTime={30} redirectTo="/admin/login" />
   ```

## Personalização

### Alterar Tempos de Timeout

Para modificar os tempos de inatividade, ajuste os parâmetros nos arquivos de layout:

```tsx
<SessionTimeout 
  warningTime={20}  // minutos antes do aviso
  logoutTime={25}   // minutos antes do logout
  redirectTo="/login" 
/>
```

### Tempos Recomendados

- **Alta segurança**: `warningTime={10}`, `logoutTime={15}`
- **Média segurança**: `warningTime={20}`, `logoutTime={25}`
- **Baixa segurança**: `warningTime={25}`, `logoutTime={30}`

## Segurança

### Proteção de Dados
- Logout automático previne acesso não autorizado em computadores compartilhados
- Aviso prévio permite ao usuário manter a sessão ativa se ainda estiver trabalhando

### Boas Práticas
- Os tempos atuais (25/30 minutos) seguem padrões da indústria
- O sistema não armazena dados sensíveis no localStorage
- Logout completo via Supabase Auth garante invalidação da sessão

## Testes

### Testar Manualmente

1. Faça login no portal ou admin
2. Não interaja com a página por 25 minutos
3. Verifique se o modal de aviso aparece
4. Teste ambas as opções:
   - Clicar em "Continuar Conectado" deve resetar os timers
   - Clicar em "Sair Agora" deve fazer logout imediatamente
5. Se não interagir com o modal, o logout deve ocorrer aos 30 minutos

### Testar Rapidamente (Desenvolvimento)

Para testes rápidos, ajuste temporariamente os tempos:

```tsx
<SessionTimeout 
  warningTime={0.5}  // 30 segundos
  logoutTime={1}     // 1 minuto
  redirectTo="/login" 
/>
```

## Manutenção

### Logs e Debugging

Para adicionar logs ao componente, você pode incluir `console.log` nas seguintes funções:
- `resetTimers()`: Quando os timers são resetados
- `handleLogout()`: Quando o logout é executado
- `handleActivity()`: Quando atividade é detectada (cuidado com o volume)

### Possíveis Melhorias Futuras

1. **Persistência entre tabs**: Sincronizar timeout entre múltiplas abas
2. **Configuração por perfil**: Diferentes tempos para diferentes tipos de usuários
3. **Notificação sonora**: Alerta sonoro além do modal visual
4. **Histórico de sessões**: Registrar eventos de timeout no audit log
5. **Configuração via admin**: Permitir ajuste dos tempos via painel admin
