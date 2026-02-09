import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ArrowRight, CheckCircle2, Clock, XCircle, Users } from "lucide-react"

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

    // Buscar a carteirinha da usuária logada
    const { data: userCard } = await supabase
        .from('users_cards')
        .select('*')
        .eq('email', user.email)
        .single()

    const statusMap: Record<string, string> = {
        pending: 'Pendente',
        approved: 'Aprovada',
        rejected: 'Rejeitada'
    }

    const statusIcons: Record<string, React.ReactNode> = {
        pending: <Clock className="h-4 w-4" />,
        approved: <CheckCircle2 className="h-4 w-4" />,
        rejected: <XCircle className="h-4 w-4" />
    }

    const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        pending: 'secondary',
        approved: 'default',
        rejected: 'destructive'
    }

    return (
        <div className="container py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Bem-vinda ao Portal</h1>
                <p className="text-muted-foreground">Acesse as funcionalidades disponíveis</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Card de Carteirinha Profissional */}
                <Link href="/portal/carteira-profissional" className="block group">
                    <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer h-full">
                        <CardHeader>
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-blue-500">
                                    <CreditCard className="h-8 w-8 text-white" />
                                </div>
                                {userCard && (
                                    <Badge variant={statusVariants[userCard.status]} className="flex items-center gap-1">
                                        {statusIcons[userCard.status]}
                                        {statusMap[userCard.status]}
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-xl">Carteirinha Profissional</CardTitle>
                            <CardDescription>
                                {userCard 
                                    ? "Acompanhe sua solicitação e acesse sua carteirinha"
                                    : "Solicite sua carteirinha profissional"
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all">
                                Acessar
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Card MAF Community */}
                <Card className="h-full opacity-60 cursor-not-allowed">
                    <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-lg bg-gray-400">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary">Em breve...</Badge>
                        </div>
                        <CardTitle className="text-xl">MAF Community</CardTitle>
                        <CardDescription>
                            A rede social das habilitadas do MAF
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-sm font-medium text-gray-400">
                            Em desenvolvimento
                        </div>
                    </CardContent>
                </Card>

                {/* Espaço para futuros cards */}
                {/* Adicione novos cards de funcionalidades aqui */}
            </div>
        </div>
    )
}
