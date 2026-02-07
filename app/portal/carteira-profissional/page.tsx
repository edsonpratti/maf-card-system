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
        rejected: 'REJEITADA'
    }

    const statusColorMap: Record<string, string> = {
        pending: 'bg-yellow-500',
        approved: 'bg-green-500',
        rejected: 'bg-red-500'
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
                <h1 className="text-3xl font-bold">Carteira Profissional</h1>
                <p className="text-muted-foreground mt-2">
                    Gerencie sua carteirinha de habilitada MAF
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Minha Solicitação</CardTitle>
                    <CardDescription>Acompanhe o status da sua carteirinha.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {userCard ? (
                        <>
                            <div className="flex items-center justify-between border p-4 rounded-md">
                                <div>
                                    <p className="font-medium">Status Atual</p>
                                    <p className="text-sm text-muted-foreground">
                                        Última atualização: {new Date(userCard.updated_at || userCard.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <Badge className={statusColorMap[userCard.status] || 'bg-gray-500'}>
                                    {statusMap[userCard.status] || userCard.status}
                                </Badge>
                            </div>

                            <div className="space-y-2 border p-4 rounded-md">
                                <p className="text-sm"><span className="font-medium">Nome:</span> {userCard.full_name}</p>
                                <p className="text-sm"><span className="font-medium">CPF:</span> {userCard.cpf}</p>
                                <p className="text-sm"><span className="font-medium">Email:</span> {userCard.email}</p>
                            </div>

                            {userCard.status === 'approved' && userCard.qr_code_token && (
                                <Button asChild variant="default" className="w-full">
                                    <a href={`/validar/${userCard.qr_code_token}`} target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 h-4 w-4" />
                                        Visualizar Carteirinha
                                    </a>
                                </Button>
                            )}

                            {userCard.status === 'pending' && (
                                <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                    <p>Sua solicitação está em análise. Você receberá um e-mail quando for aprovada.</p>
                                </div>
                            )}

                            {userCard.status === 'rejected' && userCard.admin_notes && (
                                <div className="bg-red-50 p-4 rounded-md text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                    <p className="font-medium mb-1">Motivo da rejeição:</p>
                                    <p>{userCard.admin_notes}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-yellow-50 p-4 rounded-md text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            <p className="font-medium mb-2">Você ainda não possui uma solicitação de carteirinha.</p>
                            <Button asChild variant="default" size="sm" className="mt-2">
                                <a href="/solicitar">Solicitar Carteirinha</a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
