import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, CheckCircle2, FileText, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PendenteAprovacaoPage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Buscar informações do card do usuário
    const { data: userCard } = await supabase
        .from('users_cards')
        .select('name, status, maf_pro_id_approved, created_at')
        .eq('auth_user_id', user.id)
        .single()

    // Se já foi aprovado, redirecionar para a carteira
    if (userCard?.maf_pro_id_approved) {
        redirect('/portal/carteira-profissional')
    }

    const statusMessages = {
        'PENDENTE_MANUAL': {
            title: 'Certificado em Análise',
            description: 'Nossa equipe está analisando seu certificado',
            icon: Clock,
            color: 'text-yellow-600'
        },
        'RECUSADA': {
            title: 'Cadastro Não Aprovado',
            description: 'Infelizmente seu cadastro não foi aprovado',
            icon: FileText,
            color: 'text-red-600'
        },
        'AUTO_APROVADA': {
            title: 'Aprovado Automaticamente',
            description: 'Seu acesso foi aprovado',
            icon: CheckCircle2,
            color: 'text-green-600'
        }
    }

    const currentStatus = statusMessages[userCard?.status as keyof typeof statusMessages] || statusMessages['PENDENTE_MANUAL']
    const StatusIcon = currentStatus.icon

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Bem-vinda ao MAF Pro!</h1>
                    <p className="text-muted-foreground">
                        Olá, {userCard?.name || 'Usuária'}
                    </p>
                </div>

                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full bg-muted ${currentStatus.color}`}>
                                <StatusIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle>{currentStatus.title}</CardTitle>
                                <CardDescription>{currentStatus.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {userCard?.status === 'PENDENTE_MANUAL' && (
                            <>
                                <Alert>
                                    <Clock className="h-4 w-4" />
                                    <AlertDescription>
                                        Seu cadastro foi recebido e está em processo de validação. Você receberá um email assim que for aprovado.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-3 pt-4">
                                    <h3 className="font-semibold text-sm">O que você pode fazer enquanto aguarda:</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                                            <span>Você já tem acesso ao portal e pode atualizar suas informações</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Mail className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                            <span>Fique atenta ao seu email - você será notificada quando seu acesso ao MAF Pro ID for liberado</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Clock className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                                            <span>O processo de análise geralmente leva até 48 horas úteis</span>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}

                        {userCard?.status === 'RECUSADA' && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    Seu cadastro não foi aprovado. Por favor, entre em contato com o suporte para mais informações.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Sobre o MAF Pro ID</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            O MAF Pro ID é sua carteirinha profissional digital que comprova sua certificação.
                        </p>
                        <p>
                            Após a aprovação, você terá acesso a:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Carteirinha digital com QR Code de validação</li>
                            <li>Download do PDF da sua carteirinha</li>
                            <li>Compartilhamento digital da sua certificação</li>
                            <li>Gerenciamento dos seus dados profissionais</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="outline">
                        <Link href="/portal">
                            Voltar ao Portal
                        </Link>
                    </Button>
                    <Button asChild variant="default">
                        <a href="mailto:suporte@mafpro.com">
                            Entrar em Contato
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    )
}
