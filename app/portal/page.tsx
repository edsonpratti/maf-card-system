import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ModuleCard } from "@/components/modules/module-card"
import { CreditCard, FileText, Video, Users } from "lucide-react"
import { Module } from "@/lib/modules"

const modules: Module[] = [
  {
    id: 'carteira-profissional',
    title: 'Carteira Profissional',
    description: 'Solicite e gerencie sua carteirinha de habilitada MAF',
    icon: CreditCard,
    href: '/portal/carteira-profissional',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    status: 'active',
    badge: 'Ativo'
  },
  {
    id: 'arquivos',
    title: 'Biblioteca de Arquivos',
    description: 'Acesse apostilas, materiais didáticos e documentos',
    icon: FileText,
    href: '/portal/arquivos',
    color: 'bg-gradient-to-br from-green-500 to-green-600',
    status: 'coming-soon'
  },
  {
    id: 'video-aulas',
    title: 'Vídeo Aulas',
    description: 'Assista aulas gravadas e conteúdos exclusivos',
    icon: Video,
    href: '/portal/video-aulas',
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    status: 'coming-soon'
  },
  {
    id: 'rede-social',
    title: 'Rede Social MAF',
    description: 'Conecte-se com outras habilitadas da comunidade',
    icon: Users,
    href: '/portal/rede-social',
    color: 'bg-gradient-to-br from-pink-500 to-pink-600',
    status: 'coming-soon'
  }
]

export default async function PortalPage() {
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
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                    Portal da Aluna
                </h1>
                <p className="text-muted-foreground">
                    Bem-vinda, {user.email}
                </p>
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Módulos Disponíveis</h2>
                <p className="text-sm text-muted-foreground">
                    Escolha um módulo para acessar seus recursos
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <ModuleCard key={module.id} module={module} />
                ))}
            </div>
        </div>
    )
}
