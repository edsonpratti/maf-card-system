# Implementação: Geração de PDF do Cartão MAF

## 📋 Resumo

Foi implementado um sistema completo de geração de PDF para cartões de habilitadas MAF, com design moderno inspirado no modelo fornecido (gradiente preto-laranja).

## ✨ Funcionalidades Implementadas

### 1. Geração Automática de Credenciais
- **card_number**: Código único gerado automaticamente (formato: `MAF-{timestamp}-{random}`)
- **validation_token**: Token de 64 caracteres hexadecimais para validação via QR Code
- Geração ocorre tanto na aprovação automática quanto na aprovação manual

### 2. Design do Cartão PDF
O PDF gerado inclui:
- ✅ Gradiente moderno (preto → laranja/dourado)
- ✅ Logo "MAF" no canto superior esquerdo
- ✅ Badge "Habilitada MAF" no canto superior direito
- ✅ Nome completo em destaque no centro
- ✅ CPF da pessoa
- ✅ Código único na parte inferior
- ✅ QR Code para validação no canto inferior direito
- ✅ Tamanho de cartão de crédito (85.6mm x 53.98mm)

### 3. Acesso ao PDF

#### Portal da Aluna (`/portal/carteira-profissional`)
- Botão "Baixar Cartão PDF" para usuárias aprovadas
- Botão "Validar Carteirinha Online" para verificação
- Exibição apenas para status `AUTO_APROVADA` ou `APROVADA_MANUAL`

#### Painel Admin (`/admin/solicitacoes/[id]`)
- Seção especial para cartões aprovados
- Botão de download do PDF do cartão
- Botão de validação online
- Visualização dos dados do cartão

## 🔧 Arquivos Modificados/Criados

### Novos Arquivos
1. **`app/api/cartao/[id]/route.ts`**
   - API route para usuárias baixarem seu próprio cartão
   - Validação de autenticação e permissões
   - Geração on-demand do PDF

2. **`app/api/admin/cartao/[id]/route.ts`**
   - API route para admins visualizarem qualquer cartão
   - Requer permissão de admin

### Arquivos Modificados
1. **`lib/pdf-generator.ts`**
   - Redesign completo da função `generateCardPDF`
   - Implementação de gradiente por camadas
   - Layout moderno com tipografia hierárquica
   - QR Code otimizado

2. **`app/actions/admin.ts`**
   - Geração automática de `card_number` e `validation_token` na aprovação manual
   - Verifica se já existem antes de gerar novos

3. **`app/actions/solicitar.ts`**
   - Geração de credenciais na aprovação automática
   - Inclusão de `issued_at` para cartões auto-aprovados

4. **`app/portal/carteira-profissional/page.tsx`**
   - Botão de download do PDF
   - Link para validação online
   - Ajuste de status para enums corretos do banco

5. **`app/admin/solicitacoes/[id]/page.tsx`**
   - Seção destacada para cartões aprovados
   - Botões de ação para download e validação

## 🔐 Segurança

- ✅ Usuárias só podem acessar seu próprio cartão
- ✅ Verificação de autenticação obrigatória
- ✅ Admins têm acesso a todos os cartões
- ✅ Validação de status (apenas aprovados podem gerar PDF)
- ✅ Verificação de dados completos antes de gerar

## 🎯 Fluxo de Uso

### Para Usuária
1. Faz login no portal
2. Acessa "Carteira Profissional"
3. Se aprovada, vê o botão "Baixar Cartão PDF"
4. Clica e baixa o PDF automaticamente

### Para Admin
1. Acessa detalhes de uma solicitação
2. Aprova manualmente (ou vê auto-aprovada)
3. Sistema gera automaticamente `card_number` e `validation_token`
4. Admin pode baixar o PDF da seção "Documentação"
5. Admin pode enviar o link de validação para a usuária

## 📊 Dados do Cartão

Informações exibidas no PDF:
- Nome completo
- CPF
- Código único (card_number)
- QR Code com link de validação
- Badge "Habilitada MAF"

## 🔗 Validação Online

O QR Code aponta para: `{APP_URL}/validar/{validation_token}`

Esta página pública mostra:
- Status do cartão (válido/inválido/revogado)
- Nome da titular
- CPF parcialmente mascarado
- Número do cartão
- Data de emissão

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar logo MAF como imagem real (atualmente é texto)
- [ ] Implementar cache de PDFs no Supabase Storage
- [ ] Adicionar watermark ou elementos de segurança
- [ ] Permitir impressão frente e verso
- [ ] Adicionar foto da habilitada (se disponível)

## 📝 Notas Técnicas

- O gradiente é simulado com 50 retângulos sobrepostos (pdf-lib não suporta gradientes nativos)
- QR Code é gerado com margem mínima para economizar espaço
- Tamanho do arquivo PDF: ~50-100 KB dependendo do QR Code
- Fonte: Helvetica (padrão do pdf-lib, sem necessidade de embed de fontes customizadas)
