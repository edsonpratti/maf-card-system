import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Clock, Mail, MessageCircle } from "lucide-react"

export default function ConfirmacaoPage({
    searchParams,
}: {
    searchParams: { status?: string }
}) {
    const isAutoApproved = searchParams.status === "AUTO_APROVADA"

    return (
        <div className="container py-10">
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Solicitação Enviada com Sucesso!</CardTitle>
                    <CardDescription>
                        Sua solicitação foi recebida e está sendo processada.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isAutoApproved ? (
                        <>
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Aprovação Automática
                                </h3>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Seu CPF foi encontrado em nossa base de alunas! Sua carteira profissional foi aprovada automaticamente.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Próximos Passos
                                </h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="font-semibold min-w-6">1.</span>
                                        <span>Você receberá um e-mail com o link de primeiro acesso para criar sua senha.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold min-w-6">2.</span>
                                        <span>Clique no link recebido e defina sua senha de acesso.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold min-w-6">3.</span>
                                        <span>Após criar sua senha, você poderá acessar o MAF Pro e visualizar sua carteira profissional digital.</span>
                                    </li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Em Análise Manual
                                </h3>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    Sua solicitação será analisada pela nossa equipe. Isso pode levar de 1 a 3 dias úteis.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Próximos Passos
                                </h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="font-semibold min-w-6">1.</span>
                                        <span>Você receberá um e-mail com instruções para criar sua senha e acessar o portal do MAF Pro.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold min-w-6">2.</span>
                                        <span>Clique no link do e-mail e defina sua senha de acesso ao portal.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold min-w-6">3.</span>
                                        <span>O download da sua carteirinha profissional ficará condicionado à validação do administrador.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold min-w-6">4.</span>
                                        <span>Após a validação, você poderá acessar o portal e baixar sua carteira profissional digital.</span>
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}

                    <div className="border-t pt-4 space-y-3">
                        <h3 className="font-semibold">Informações Importantes</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex gap-2">
                                <span>•</span>
                                <span>Verifique sua caixa de spam caso não receba nosso e-mail.</span>
                            </li>
                            <li className="flex gap-2">
                                <span>•</span>
                                <span>O link de primeiro acesso é válido por 7 dias.</span>
                            </li>
                            <li className="flex gap-2">
                                <span>•</span>
                                <span>Em caso de dúvidas, entre em contato com nossa equipe.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button asChild className="flex-1">
                            <Link href="/login">
                                Ir para Login
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                            <a href="https://wa.me/5528999153511?text=Oi%2C%20fiz%20meu%20cadastro%20no%20MAF%20Pro%20e%20tenho%20dúvidas" target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Falar no WhatsApp
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
