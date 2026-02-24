import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ArrowLeft } from "lucide-react"

export default async function CarteiraPage() {
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
        pending: 'PENDENTE',
        approved: 'APROVADA',
        rejected: 'REJEITADA',
        AUTO_APROVADA: 'AUTO APROVADA',
        APROVADA_MANUAL: 'APROVADA',
        PENDENTE_MANUAL: 'PENDENTE',
        RECUSADA: 'RECUSADA'
    }

    const getStatusVariant = (status: string): "success" | "warning" | "destructive" | "secondary" => {
        switch (status) {
            case 'AUTO_APROVADA':
            case 'APROVADA_MANUAL':
            case 'approved':
                return 'success'
            case 'PENDENTE_MANUAL':
            case 'pending':
                return 'warning'
            case 'RECUSADA':
            case 'rejected':
                return 'destructive'
            default:
                return 'secondary'
        }
    }

    return (
        <div className="container py-6 sm:py-8 lg:py-10 px-4 sm:px-6">
            <div className="mb-4 sm:mb-6">
                <Button variant="ghost" asChild className="mb-3 sm:mb-4 h-9 px-2 sm:px-3">
                    <Link href="/portal">
                        <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                        <span className="text-sm">Voltar ao Portal</span>
                    </Link>
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold">Carteira Profissional</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                    Gerencie sua carteira profissional MAF Pro
                </p>
            </div>

            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Minha Solicitação</CardTitle>
                    <CardDescription className="text-sm">Acompanhe o status da sua carteira profissional.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    {userCard ? (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border p-3 sm:p-4 rounded-md">
                                <div>
                                    <p className="font-medium text-sm sm:text-base">Status Atual</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Última atualização: {new Date(userCard.updated_at || userCard.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                    </p>
                                </div>
                                <Badge variant={getStatusVariant(userCard.status)} className="self-start sm:self-auto">
                                    {statusMap[userCard.status] || userCard.status}
                                </Badge>
                            </div>

                            <div className="space-y-2 border p-3 sm:p-4 rounded-md">
                                <p className="text-xs sm:text-sm"><span className="font-medium">Nome:</span> {userCard.full_name}</p>
                                <p className="text-xs sm:text-sm"><span className="font-medium">CPF:</span> {userCard.cpf}</p>
                                <p className="text-xs sm:text-sm break-all"><span className="font-medium">Email:</span> {userCard.email}</p>
                            </div>

                            {(userCard.status === 'AUTO_APROVADA' || userCard.status === 'APROVADA_MANUAL') && (
                                <div className="space-y-2">
                                    <Button asChild variant="success" className="w-full h-10 sm:h-11">
                                        <a href={`/api/cartao/${userCard.id}`} download>
                                            <Download className="mr-2 h-4 w-4" />
                                            <span className="text-sm sm:text-base">Baixar Cartão PDF</span>
                                        </a>
                                    </Button>
                                    {userCard.validation_token && (
                                        <Button asChild variant="outline-info" className="w-full h-10 sm:h-11">
                                            <a href={`/validar/${userCard.validation_token}`} target="_blank" rel="noopener noreferrer">
                                                <span className="text-sm sm:text-base">Validar Carteirinha Online</span>
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            )}

                            {userCard.status === 'PENDENTE_MANUAL' && (
                                <div className="bg-blue-50 p-3 sm:p-4 rounded-md text-xs sm:text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                    <p>Sua solicitação está em análise. Você receberá um e-mail quando for aprovada.</p>
                                </div>
                            )}

                            {userCard.status === 'RECUSADA' && userCard.rejection_reason && (
                                <div className="bg-red-50 p-3 sm:p-4 rounded-md text-xs sm:text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                    <p className="font-medium mb-1">Motivo da rejeição:</p>
                                    <p>{userCard.rejection_reason}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-yellow-50 p-3 sm:p-4 rounded-md text-xs sm:text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            <p className="font-medium mb-2">Você ainda não possui uma solicitação de carteira profissional.</p>
                            <Button asChild variant="default" size="sm" className="mt-2 h-9">
                                <a href="/solicitar">Solicitar Carteira Profissional</a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
