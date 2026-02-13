# Próximos Passos - Configuração do Supabase

## 1. Executar Migration no Banco de Dados

Execute o seguinte SQL no Supabase Dashboard (SQL Editor):

```sql
-- Migration: Adicionar foto e data de habilitação
-- Descrição: Adiciona campos para foto da habilitada e data de habilitação ao cartão
-- Data: 2026-02-13

-- Adicionar campo para caminho da foto no Storage
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS photo_path TEXT;

-- Adicionar campo para data de habilitação
ALTER TABLE public.users_cards 
ADD COLUMN IF NOT EXISTS certification_date DATE;

-- Índice para busca por data de certificação
CREATE INDEX IF NOT EXISTS idx_users_cards_certification_date 
ON public.users_cards(certification_date) 
WHERE certification_date IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.users_cards.photo_path IS 'Caminho da foto da habilitada no Supabase Storage (bucket: photos)';
COMMENT ON COLUMN public.users_cards.certification_date IS 'Data de habilitação da aluna. Se NULL, usar created_at como fallback';
```

## 2. Criar Bucket de Fotos no Supabase Storage

1. Acesse o Supabase Dashboard
2. Vá para **Storage** no menu lateral
3. Clique em **Create a new bucket**
4. Nome do bucket: `photos`
5. Configurar como **Public bucket** (para permitir leitura pública dos PDFs)
6. Clique em **Create bucket**

### Configurar Políticas de Acesso

Após criar o bucket, configure as políticas:

**Policy 1: Upload (INSERT)**
- Nome: `Authenticated users can upload photos`
- Allowed operation: INSERT
- Policy definition:
```sql
(bucket_id = 'photos'::text) AND (auth.role() = 'authenticated'::text)
```

**Policy 2: Read (SELECT)**
- Nome: `Public can view photos`
- Allowed operation: SELECT
- Policy definition:
```sql
bucket_id = 'photos'::text
```

## 3. Testar a Implementação

### Teste 1: Novo Cadastro com Foto
1. Acesse o formulário de cadastro
2. Preencha todos os campos
3. Faça upload de uma foto (JPG ou PNG, máximo 2MB)
4. Opcionalmente, informe a data de habilitação
5. Submeta o formulário
6. Após aprovação, baixe o PDF do cartão
7. Verifique se a foto e a data aparecem corretamente

### Teste 2: Cadastro sem Data de Habilitação
1. Faça um cadastro sem informar a data de habilitação
2. Gere o PDF
3. Verifique que a data de cadastro (`created_at`) é usada

### Teste 3: Cadastros Antigos
1. Acesse um cadastro existente (sem foto)
2. Gere o PDF
3. Verifique que o logo "MAF" aparece no lugar da foto
4. Confirme que a data de cadastro é usada

### Teste 4: Validações
- Tente fazer upload de arquivo > 2MB (deve rejeitar)
- Tente fazer upload de formato inválido (deve rejeitar)
- Tente cadastrar sem foto (deve rejeitar)

## 4. Solução de Problemas (Troubleshooting)

### Erro: "O bucket 'photos' não existe no Supabase Storage"

**Causa**: O bucket de fotos não foi criado no Supabase Storage.

**Solução**:
1. Vá para Supabase Dashboard → Storage
2. Crie um bucket chamado `photos` (público)
3. Configure as políticas conforme a seção 2 acima
4. Execute o script de diagnóstico: `npx tsx scripts/check-supabase-storage.ts`

### Erro: "Erro de permissão: Não foi possível fazer upload da foto"

**Causa**: As políticas (policies) do bucket não estão configuradas corretamente.

**Solução**:
1. Vá para Supabase Dashboard → Storage → `photos` bucket
2. Clique na aba "Policies"
3. Verifique se as políticas de INSERT e SELECT estão criadas (veja seção 2)
4. Se necessário, delete as políticas existentes e recrie-as

### Erro: "Erro ao fazer upload da foto" (genérico)

**Causa**: Pode ser vários problemas (rede, tamanho do arquivo, etc.)

**Solução**:
1. Verifique se o arquivo tem menos de 2MB
2. Verifique se o formato é JPG ou PNG
3. Verifique sua conexão com a internet
4. Execute o script de diagnóstico: `npx tsx scripts/check-supabase-storage.ts`
5. Verifique os logs do servidor no terminal onde `npm run dev` está rodando

### Script de Diagnóstico

Para verificar se tudo está configurado corretamente, execute:

```bash
npx tsx scripts/check-supabase-storage.ts
```

Este script irá:
- ✅ Verificar se os buckets `photos` e `certificates` existem
- ✅ Testar permissões de upload
- ✅ Indicar exatamente o que precisa ser corrigido

## Resumo das Mudanças

✅ **Database**: Campos `photo_path` e `certification_date` adicionados
✅ **Formulário**: Upload de foto obrigatório + data de habilitação opcional
✅ **Backend**: Validação e upload de foto para Storage
✅ **PDF**: Foto exibida no canto superior esquerdo + data formatada
✅ **Compatibilidade**: Cadastros antigos continuam funcionando normalmente
