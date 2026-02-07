import { getServiceSupabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import RequestActions from "@/components/admin/request-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Download, Calendar, FileCheck, MapPin, Phone, Mail } from "lucide-react"

async function getRequestDetail(id: string) {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase.from("users_cards").select("*").eq("id", id).single()
    if (error || !data) return null
    return data
}

async function getCertificateUrl(filePath: string | null) {
    if (!filePath) return null
    const supabase = getServiceSupabase()
    const { data } = await supabase.storage.from("certificates").createSignedUrl(filePath, 3600)
    return data?.signedUrl || null
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const request = await getRequestDetail(id)

    if (!request) {
        notFound()
    }

    const address = request.address_json as any
    const certificateUrl = await getCertificateUrl(request.certificate_file_path)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin/solicitacoes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">Detalhes da Solicitação</h1>
                    <p className="text-sm text-muted-foreground mt-1">ID: {request.id}</p>
                </div>
                <Badge 
                    variant={
                        request.status === "PENDENTE_MANUAL" || request.status === "WAITLIST_MANUAL" 
                            ? "destructive" 
                            : request.status === "APROVADA_MANUAL" || request.status === "AUTO_APROVADA"
                            ? "default"
                            : "secondary"
                    }
                >
                    {request.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Dados Pessoais */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Dados Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <FileCheck className="h-4 w-4" />
                                    Nome Completo
                                </p>
                                <p className="text-lg font-semibold">{request.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">CPF</p>
                                <p className="font-mono">{request.cpf}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    WhatsApp
                                </p>
                                <p className="font-mono">{request.whatsapp}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    E-mail
                                </p>
                                <p className="break-all">{request.email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Data da Solicitação
                                </p>
                                <p>{new Date(request.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                            {request.updated_at && request.updated_at !== request.created_at && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                                    <p>{new Date(request.updated_at).toLocaleString('pt-BR')}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Informações Adicionais */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5" />
                            Status e Datas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {request.issued_at && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Emitido em</p>
                                <p>{new Date(request.issued_at).toLocaleString('pt-BR')}</p>
                            </div>
                        )}
                        {request.card_number && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Número do Cartão</p>
                                <p className="font-mono font-semibold">{request.card_number}</p>
                            </div>
                        )}
                        {request.rejection_reason && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground text-destructive">Motivo da Recusa</p>
                                <p className="text-sm bg-destructive/10 p-2 rounded">{request.rejection_reason}</p>
                            </div>
                        )}
                        {request.validation_token && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Token de Validação</p>
                                <p className="font-mono text-xs break-all">{request.validation_token}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Endereço */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Endereço Completo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Rua</p>
                                <p>{address?.street || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Número</p>
                                    <p>{address?.number || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Complemento</p>
                                    <p>{address?.complement || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Bairro</p>
                                <p>{address?.neighborhood || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Cidade</p>
                                    <p>{address?.city || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                                    <p>{address?.state || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">CEP</p>
                                <p className="font-mono">{address?.cep || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Certificado e Ações */}
                <Card>
                    <CardHeader>
                        <CardTitle>Documentação</CardTitle>
                        <CardDescription>Certificado enviado pela usuária</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {request.certificate_file_path ? (
                            <div className="space-y-3">
                                <div className="rounded-md border p-4 bg-muted/50">
                                    <p className="text-sm font-medium mb-3">Certificado Disponível</p>
                                    <div className="space-y-2">
                                        {certificateUrl ? (
                                            <>
                                                <Button asChild variant="outline" className="w-full">
                                                    <a href={certificateUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Baixar Certificado
                                                    </a>
                                                </Button>
                                                <Button asChild variant="secondary" className="w-full">
                                                    <a href={certificateUrl} target="_blank" rel="noopener noreferrer">
                                                        <FileCheck className="mr-2 h-4 w-4" />
                                                        Visualizar Certificado
                                                    </a>
                                                </Button>
                                            </>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center">
                                                Caminho: {request.certificate_file_path}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-md border p-4 bg-yellow-50 dark:bg-yellow-900/20">
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
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
