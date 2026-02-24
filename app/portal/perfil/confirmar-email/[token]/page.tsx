import { confirmEmailChange } from "@/app/actions/perfil"
import Link from "next/link"
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface PageProps {
    params: Promise<{ token: string }>
}

export const metadata = {
    title: "Confirmar Email | MAF Pro",
}

export default async function ConfirmarEmailPage({ params }: PageProps) {
    const { token } = await params

    const result = await confirmEmailChange(token)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <Card className="shadow-lg">
                    <CardHeader className="text-center pb-4">
                        <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
                            result.success
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : "bg-red-100 dark:bg-red-900/30"
                        }`}>
                            {result.success ? (
                                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                        <CardTitle className="text-xl">
                            {result.success ? "Email confirmado!" : "Não foi possível confirmar"}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                            {result.message}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3">
                        {result.success ? (
                            <>
                                {result.newEmail && (
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground mb-1">Novo email:</p>
                                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-md">
                                            {result.newEmail}
                                        </p>
                                    </div>
                                )}
                                <p className="text-xs text-center text-muted-foreground">
                                    Sua sessão será encerrada. Faça login novamente com o novo endereço de email.
                                </p>
                                <Button asChild className="w-full mt-2">
                                    <Link href="/login">
                                        Ir para o login
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/portal/perfil">
                                        Voltar ao perfil
                                    </Link>
                                </Button>
                                <Button asChild variant="ghost" className="w-full">
                                    <Link href="/portal">
                                        Ir para o portal
                                    </Link>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
