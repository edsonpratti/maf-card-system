import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ArrowRight, CheckCircle2, Clock, XCircle, Users, GraduationCap, HelpCircle, Shield } from "lucide-react"

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
        <div className="container py-6 sm:py-8 lg:py-10 px-4 sm:px-6">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bem-vinda ao MAF Pro</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Acesse as funcionalidades disponíveis</p>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* MAF Pro ID - Carteira Profissional */}
                <Link href="/portal/carteira-profissional" className="block group">
                    <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] sm:hover:scale-105 cursor-pointer h-full">
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-blue-500">
                                    <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                </div>
                                {userCard && (
                                    <Badge variant={statusVariants[userCard.status]} className="flex items-center gap-1 text-xs">
                                        {statusIcons[userCard.status]}
                                        <span className="hidden xs:inline">{statusMap[userCard.status]}</span>
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-lg sm:text-xl">MAF Pro ID</CardTitle>
                            <CardDescription className="text-sm">
                                {userCard 
                                    ? "Acompanhe sua solicitação e acesse sua carteira profissional"
                                    : "Solicite sua carteira profissional"
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                            <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all">
                                Acessar módulo
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* MAF Pro Community */}
                <Card className="h-full opacity-60 cursor-not-allowed">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="p-2 sm:p-3 rounded-lg bg-gray-400">
                                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">Em breve</Badge>
                        </div>
                        <CardTitle className="text-lg sm:text-xl">MAF Pro Community</CardTitle>
                        <CardDescription className="text-sm">
                            Rede social e feed para conexão entre profissionais
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Este módulo estará disponível em breve
                        </p>
                    </CardContent>
                </Card>

                {/* MAF Pro Academy */}
                <Card className="h-full opacity-60 cursor-not-allowed">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="p-2 sm:p-3 rounded-lg bg-gray-400">
                                <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">Em breve</Badge>
                        </div>
                        <CardTitle className="text-lg sm:text-xl">MAF Pro Academy</CardTitle>
                        <CardDescription className="text-sm">
                            Conteúdos educativos, vídeos e materiais de aprendizagem
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Este módulo estará disponível em breve
                        </p>
                    </CardContent>
                </Card>

                {/* MAF Pro Support */}
                <Card className="h-full opacity-60 cursor-not-allowed">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="p-2 sm:p-3 rounded-lg bg-gray-400">
                                <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">Em breve</Badge>
                        </div>
                        <CardTitle className="text-lg sm:text-xl">MAF Pro Support</CardTitle>
                        <CardDescription className="text-sm">
                            Dúvidas, orientações e avisos importantes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Este módulo estará disponível em breve
                        </p>
                    </CardContent>
                </Card>

                {/* MAF Pro Admin */}
                <Card className="h-full opacity-60 cursor-not-allowed">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="p-2 sm:p-3 rounded-lg bg-gray-400">
                                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">Restrito</Badge>
                        </div>
                        <CardTitle className="text-lg sm:text-xl">MAF Pro Admin</CardTitle>
                        <CardDescription className="text-sm">
                            Governança e gestão do sistema (acesso administrativo)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Acesso restrito a administradores
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
