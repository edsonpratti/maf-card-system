# Email de Recusa de Cadastro

## Visão Geral

Quando um administrador recusa um cadastro de usuário, o sistema envia automaticamente um email informando sobre a recusa, incluindo a justificativa fornecida pelo admin e um link direto para o WhatsApp do suporte.

## Como Funciona

### 1. Processo de Recusa

Quando um admin recusa uma solicitação:

1. O admin seleciona "Recusar" na tela de ações
2. Um modal é exibido solicitando uma justificativa obrigatória
3. Ao confirmar, o status é atualizado para `RECUSADA`
4. A justificativa é salva no campo `rejection_reason`
5. **Automaticamente**, um email é enviado ao usuário

### 2. Conteúdo do Email

O email de recusa contém:

- **Saudação personalizada** com o nome do usuário
- **Mensagem clara** informando sobre a recusa
- **Justificativa do admin** destacada em um box vermelho
- **Mensagem de suporte** tranquilizando o usuário
- **Botão CTA** com link direto para WhatsApp do suporte
- **Box informativo** sobre como a equipe pode ajudar

### 3. Template Visual

O email utiliza um design profissional e responsivo:

- **Header vermelho/gradiente** indicando a recusa
- **Conteúdo claro** e amigável
- **Botão verde do WhatsApp** com destaque
- **Footer padrão** do sistema

## Configuração

### Variável de Ambiente Necessária

No arquivo `.env.local`, adicione:

```env
# WhatsApp Support (para link no email de recusa)
# Formato: código do país + DDD + número (sem espaços ou caracteres especiais)
# Exemplo: 5511999999999 (Brasil: 55, SP: 11, Número: 999999999)
NEXT_PUBLIC_WHATSAPP_SUPPORT=5511999999999
```

**Formato do número:**
- Código do país (Brasil: 55)
- DDD (São Paulo: 11)
- Número do WhatsApp (9 dígitos)
- **Sem espaços, traços ou parênteses**

**Exemplo:** `5511987654321`

### Mensagem Pré-configurada no WhatsApp

Quando o usuário clica no botão, o WhatsApp abre com a seguinte mensagem pré-preenchida:

> "Olá! Recebi uma notificação sobre minha solicitação de cadastro e gostaria de mais informações."

Isso facilita o início da conversa e contextualiza o atendente.

## Implementação Técnica

### Arquivos Modificados

1. **[lib/email-templates.ts](../../lib/email-templates.ts)**
   - Adicionada função `rejectionEmailTemplate()`
   - Template HTML responsivo com design profissional

2. **[app/actions/first-access.ts](../../app/actions/first-access.ts)**
   - Adicionada função `sendRejectionEmail()`
   - Integração com Resend API
   - Logs detalhados do envio

3. **[app/actions/admin.ts](../../app/actions/admin.ts)**
   - Atualizada função `updateRequestStatus()`
   - Envio automático de email quando status = RECUSADA
   - Execução assíncrona (não-bloqueante)

### Fluxo de Código

```typescript
// 1. Admin recusa com justificativa
updateRequestStatus(id, "RECUSADA", reason)

// 2. Status atualizado no banco
await supabase.from("users_cards").update({
  status: "RECUSADA",
  rejection_reason: reason
})

// 3. Dados do usuário recuperados
const { data: userData } = await supabase
  .from("users_cards")
  .select("email, name")
  .eq("id", id)
  .single()

// 4. Email enviado (assíncrono, não-bloqueante)
sendRejectionEmail(userData.email, userData.name, reason)
```

## Características Importantes

### ✅ Vantagens

- **Automático**: Não requer ação adicional do admin
- **Não-bloqueante**: Se o email falhar, a recusa ainda é processada
- **Informativo**: Usuário recebe contexto completo
- **Acionável**: Link direto para resolução via WhatsApp
- **Profissional**: Design consistente com outros emails do sistema

### 🔒 Segurança

- Email enviado apenas para usuários com status RECUSADA
- Justificativa é obrigatória (validada no frontend)
- Dados sensíveis não são expostos
- Link do WhatsApp é público mas genérico

### 📊 Logs

Todos os envios são logados com detalhes:

```
📧 [REJECTION] Iniciando envio de email para: { email, name }
✅ [REJECTION] Email de recusa enviado com sucesso! ID: xxx
❌ [REJECTION] Erro ao enviar email: [erro]
```

## Teste

Para testar o envio do email:

1. Acesse o painel admin
2. Vá para "Solicitações"
3. Selecione uma solicitação PENDENTE_MANUAL
4. Clique em "Recusar"
5. Insira uma justificativa clara (ex: "Certificado ilegível")
6. Confirme
7. Verifique o email na caixa de entrada do usuário

## Personalização

### Alterar o Texto do Email

Edite a função `rejectionEmailTemplate()` em [lib/email-templates.ts](../../lib/email-templates.ts):

```typescript
export function rejectionEmailTemplate(name: string, rejectionReason: string) {
  // Personalize textos, cores, estilos aqui
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '5511999999999'
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=...`
  
  return `
    <!DOCTYPE html>
    ...
  `
}
```

### Alterar Mensagem do WhatsApp

Edite o parâmetro `text` na URL do WhatsApp:

```typescript
const whatsappLink = `https://wa.me/${whatsappNumber}?text=Sua%20mensagem%20personalizada`
```

**Nota:** Use `%20` para espaços na URL.

## Troubleshooting

### Email não está sendo enviado

1. **Verifique as credenciais do Resend**
   ```env
   RESEND_API_KEY=re_xxxxx
   RESEND_FROM_EMAIL=seu-email-verificado@dominio.com
   ```

2. **Verifique os logs do servidor**
   ```bash
   # Procure por [REJECTION] nos logs
   npm run dev
   ```

3. **Teste o email manualmente**
   ```typescript
   // No console do Supabase SQL Editor
   SELECT email, name FROM users_cards WHERE id = 'xxx';
   ```

### Link do WhatsApp não funciona

1. **Verifique o formato do número**
   - Deve ter formato internacional: `5511999999999`
   - Sem espaços, parênteses ou traços

2. **Teste o link manualmente**
   ```
   https://wa.me/5511999999999?text=Teste
   ```

### Usuário não recebeu o email

1. Verifique spam/lixeira
2. Confirme o email cadastrado no banco
3. Verifique status do Resend Dashboard
4. Verifique domínio verificado no Resend

## Roadmap Futuro

Melhorias planejadas:

- [ ] Dashboard de emails enviados
- [ ] Retry automático em caso de falha
- [ ] Templates personalizáveis via admin
- [ ] Múltiplos canais de suporte (Telegram, Discord)
- [ ] Analytics de abertura/cliques

## Suporte

Para dúvidas ou problemas:

1. Verifique este documento
2. Consulte [Troubleshooting Geral](../troubleshooting/README.md)
3. Entre em contato com o time de desenvolvimento
