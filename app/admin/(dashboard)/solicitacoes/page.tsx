
import Link from "next/link"
import { getRequests, getValidationStats } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RequestFilters } from "@/components/admin/request-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, FileCheck } from "lucide-react"

export default async function SolicitacoesPage({
    searchParams,
}: {
    searchParams: { 
        status?: string
        name?: string
        cpf?: string
        startDate?: string
        endDate?: string
    }
}) {
    const filters = {
        status: searchParams.status || "ALL",
        name: searchParams.name,
        cpf: searchParams.cpf,
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
    }
    
    const [requests, stats] = await Promise.all([
        getRequests(filters),
        getValidationStats()
    ])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "AUTO_APROVADA":
                return <Badge variant="success">Auto Aprovada</Badge>
            case "APROVADA_MANUAL":
                return <Badge variant="info">Aprovada</Badge>
            case "PENDENTE_MANUAL":
                return <Badge variant="warning">Pendente</Badge>
            case "RECUSADA":
                return <Badge variant="outline-destructive">Recusada</Badge>
            case "REVOGADA":
                return <Badge variant="outline-warning">Revogada</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Solicitações</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie solicitações de carteirinha e validações de certificados
                </p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Aguardando validação</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium">Auto Aprovadas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-green-500">{stats.autoApproved}</div>
                        <p className="text-xs text-muted-foreground">Validação automática</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
                        <FileCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-blue-500">{stats.manualApproved}</div>
                        <p className="text-xs text-muted-foreground">Validação manual</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium">Recusadas</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
                        <p className="text-xs text-muted-foreground">Certificados rejeitados</p>
                    </CardContent>
                </Card>
            </div>

            <RequestFilters />

            {/* Desktop Table */}
            <div className="hidden md:block border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests && requests.length > 0 ? (
                            requests.map((req: any) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.name}</TableCell>
                                    <TableCell>{req.cpf}</TableCell>
                                    <TableCell className="text-sm">{req.email || '-'}</TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell>{new Date(req.created_at).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/admin/solicitacoes/${req.id}`}>Ver Detalhes</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Nenhuma solicitação encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {requests && requests.length > 0 ? (
                    requests.map((req: any) => (
                        <Card key={req.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{req.name}</p>
                                        <p className="text-xs text-muted-foreground">{req.cpf}</p>
                                    </div>
                                    {getStatusBadge(req.status)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(req.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                                        <Link href={`/admin/solicitacoes/${req.id}`}>Ver Detalhes</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Nenhuma solicitação encontrada.
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    <strong>Total de solicitações:</strong> {stats.total}
                    {requests && requests.length !== stats.total && (
                        <> | <strong>Filtradas:</strong> {requests.length}</>
                    )}
                </p>
            </div>
        </div>
    )
}
