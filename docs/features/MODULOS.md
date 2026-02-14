# Sistema Modular - MAF Habilitada

## Visão Geral

O sistema MAF Habilitada foi projetado com uma arquitetura modular que permite adicionar facilmente novos recursos e funcionalidades.

## Estrutura de Módulos

### Módulos Disponíveis

#### 1. Carteira Profissional (Ativo)
- **Rota**: `/portal/carteira-profissional`
- **Descrição**: Sistema de solicitação e gerenciamento de carteirinhas de habilitada MAF
- **Funcionalidades**:
  - Solicitação de carteirinha
  - Acompanhamento de status
  - Download de carteirinha aprovada
  - Visualização de dados cadastrais

#### 2. Biblioteca de Arquivos (Em breve)
- **Rota**: `/portal/arquivos`
- **Descrição**: Acesso a apostilas, materiais didáticos e documentos
- **Status**: Planejado

#### 3. Vídeo Aulas (Em breve)
- **Rota**: `/portal/video-aulas`
- **Descrição**: Plataforma de vídeo aulas gravadas e conteúdos exclusivos
- **Status**: Planejado

#### 4. Rede Social MAF (Em breve)
- **Rota**: `/portal/rede-social`
- **Descrição**: Rede social para conexão entre habilitadas
- **Status**: Planejado

## Arquitetura Técnica

### Componentes Principais

#### 1. ModuleCard (`components/modules/module-card.tsx`)
Componente reutilizável para exibir cards de módulos no dashboard.

**Props:**
```typescript
interface ModuleCardProps {
  module: Module
}
```

**Características:**
- Exibe ícone, título e descrição do módulo
- Mostra badges de status (Ativo, Em breve, Bloqueado)
- Gerencia estados de clique (ativo/desabilitado)
- Efeitos visuais de hover para módulos ativos

#### 2. Module Type (`lib/modules.ts`)
Define a estrutura de dados para módulos.

```typescript
interface Module {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: string
  status: 'active' | 'coming-soon' | 'disabled'
  badge?: string
}
```

### Estrutura de Pastas

```
app/
  portal/
    page.tsx                    # Dashboard principal com todos os módulos
    layout.tsx                  # Layout comum com header e navegação
    carteira-profissional/
      page.tsx                  # Módulo de carteira
    arquivos/                   # Futuros módulos
    video-aulas/
    rede-social/
```

## Como Adicionar um Novo Módulo

### Passo 1: Adicionar Definição do Módulo

Em `app/portal/page.tsx`, adicione o novo módulo ao array `modules`:

```typescript
{
  id: 'nome-do-modulo',
  title: 'Nome do Módulo',
  description: 'Descrição breve do módulo',
  icon: IconeDeLucide,
  href: '/portal/nome-do-modulo',
  color: 'bg-gradient-to-br from-color-500 to-color-600',
  status: 'active', // ou 'coming-soon' ou 'disabled'
  badge: 'Ativo' // opcional
}
```

### Passo 2: Criar Página do Módulo

Crie o arquivo `app/portal/nome-do-modulo/page.tsx`:

```typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function NomeModuloPage() {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect("/login")
    }

    return (
        <div className="container py-10">
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/portal">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Portal
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Nome do Módulo</h1>
                <p className="text-muted-foreground mt-2">
                    Descrição do módulo
                </p>
            </div>

            {/* Conteúdo específico do módulo */}
        </div>
    )
}
```

### Passo 3: Importar Ícone

Certifique-se de importar o ícone do Lucide React em `app/portal/page.tsx`:

```typescript
import { IconeName } from "lucide-react"
```

## Fluxo de Navegação

1. **Login** → `/login` ou `/portal` (redireciona para login se não autenticado)
2. **Portal** → `/portal` (dashboard com todos os módulos)
3. **Módulo Específico** → `/portal/[nome-modulo]`
4. **Voltar ao Portal** → Botão "Voltar ao Portal" em cada módulo

## Estados dos Módulos

### Active (Ativo)
- Card clicável
- Navegação funcional
- Badge verde "Ativo"
- Efeito hover

### Coming Soon (Em breve)
- Card não clicável
- Badge amarelo "Em breve"
- Opacidade reduzida
- Mensagem explicativa

### Disabled (Bloqueado)
- Card não clicável
- Badge cinza com ícone de cadeado
- Opacidade reduzida
- Cursor not-allowed

## Autenticação

Todos os módulos no `/portal/*` são protegidos por autenticação:
- Middleware verifica token de autenticação
- Redirecionamento automático para `/login` se não autenticado
- Layout comum gerencia header com informações do usuário e logout

## Boas Práticas

1. **Consistência Visual**: Use cores do gradiente definidas para cada módulo
2. **Ícones**: Escolha ícones do Lucide React que representem bem o módulo
3. **Descrições**: Mantenha descrições curtas e claras (1-2 linhas)
4. **Navegação**: Sempre incluir botão "Voltar ao Portal"
5. **Layout**: Utilize o layout comum do portal (`app/portal/layout.tsx`)

## Próximos Passos

Para ativar os módulos "Em breve":
1. Implementar a funcionalidade do módulo
2. Mudar status de `coming-soon` para `active`
3. Adicionar badge apropriado
4. Testar navegação e funcionalidades
