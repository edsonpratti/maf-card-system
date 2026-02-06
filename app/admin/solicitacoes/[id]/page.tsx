import { getServiceSupabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import RequestActions from "@/components/admin/request-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"

async function getRequestDetail(id: string) {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase.from("users_cards").select("*").eq("id", id).single()
    if (error || !data) return null
    return data
}

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
    const request = await getRequestDetail(params.id)

    if (!request) {
        notFound()
    }

    const address = request.address_json as any

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin/solicitacoes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Detalhes da Solicitação</h1>
                <Badge className="ml-2">{request.status}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados da Usuária</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                            <p>{request.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">CPF</p>
                            <p>{request.cpf}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                            <p>{request.whatsapp}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                            <p>{request.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                            <p>
                                {address?.street}, {address?.number} {address?.complement}
                                <br />
                                {address?.neighborhood} - {address?.city}/{address?.state}
                                <br />
                                CEP: {address?.cep}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Documentação e Ações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {request.certificate_file_path ? (
                            <div className="rounded-md border p-4 bg-muted/50">
                                <p className="text-sm font-medium mb-2">Certificado Enviado</p>
                                {/* In real app, generate signed URL for download/view */}
                                <Button variant="outline" className="w-full">
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar Certificado
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-md border p-4 bg-yellow-50 dark:bg-yellow-900/20">
                                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                    Nenhum certificado enviado (Validação Automática ou não exigido).
                                </p>
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <p className="text-sm font-medium mb-4">Ações Administrativas</p>
                            <RequestActions request={request} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
