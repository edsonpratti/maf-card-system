
import Link from "next/link"
import { getRequests, getValidationStats } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RequestFilters } from "@/components/admin/request-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, FileCheck, ChevronLeft, ChevronRight, List } from "lucide-react"

const PAGE_SIZE = 30

export default async function SolicitacoesPage({
    searchParams,
}: {
    searchParams: Promise<{ 
        status?: string
        name?: string
        cpf?: string
        startDate?: string
        endDate?: string
        page?: string
    }>
}) {
    const { status, name, cpf, startDate, endDate, page } = await searchParams
    const currentPage = Math.max(1, parseInt(page || "1", 10))

    const filters = {
        status: status || "ALL",
        name,
        cpf,
        startDate,
        endDate,
        page: currentPage,
        pageSize: PAGE_SIZE,
    }
    
    const [{ data: requests, total }, stats] = await Promise.all([
        getRequests(filters),
        getValidationStats()
    ])

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    // Build a URL preserving all current search params but overriding page
    function pageUrl(p: number) {
        const params = new URLSearchParams()
        if (status && status !== "ALL") params.set("status", status)
        if (name) params.set("name", name)
        if (cpf) params.set("cpf", cpf)
        if (startDate) params.set("startDate", startDate)
        if (endDate) params.set("endDate", endDate)
        if (p > 1) params.set("page", String(p))
        const qs = params.toString()
        return `/admin/solicitacoes${qs ? `?${qs}` : ""}`
    }

    function getPageNumbers(): (number | "...")[] {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
        const pages: (number | "...")[] = [1]
        if (currentPage > 3) pages.push("...")
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
            pages.push(p)
        }
        if (currentPage < totalPages - 2) pages.push("...")
        pages.push(totalPages)
        return pages
    }

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
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Todas as solicitações</p>
                    </CardContent>
                </Card>
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
                                    <TableCell>{new Date(req.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/admin/solicitacoes/${req.id}`} prefetch={false}>Ver Detalhes</Link>
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
                                        {new Date(req.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                    </span>
                                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                                        <Link href={`/admin/solicitacoes/${req.id}`} prefetch={false}>Ver Detalhes</Link>
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

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 flex-wrap">
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={currentPage === 1}
                    >
                        {currentPage === 1 ? (
                            <span><ChevronLeft className="h-4 w-4" /></span>
                        ) : (
                            <Link href={pageUrl(currentPage - 1)} aria-label="Página anterior">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        )}
                    </Button>

                    {getPageNumbers().map((p, i) =>
                        p === "..." ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
                        ) : (
                            <Button
                                key={p}
                                asChild={p !== currentPage}
                                variant={p === currentPage ? "default" : "outline"}
                                size="sm"
                                className="h-8 w-8 p-0"
                            >
                                {p === currentPage ? (
                                    <span>{p}</span>
                                ) : (
                                    <Link href={pageUrl(p as number)}>{p}</Link>
                                )}
                            </Button>
                        )
                    )}

                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={currentPage === totalPages}
                    >
                        {currentPage === totalPages ? (
                            <span><ChevronRight className="h-4 w-4" /></span>
                        ) : (
                            <Link href={pageUrl(currentPage + 1)} aria-label="Próxima página">
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                    </Button>
                </div>
            )}

            <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    <strong>Total de solicitações:</strong> {stats.total}
                    {total !== stats.total && (
                        <> | <strong>Filtradas:</strong> {total}</>
                    )}
                    {total > 0 && (
                        <> | <strong>Página:</strong> {currentPage} de {totalPages}</>
                    )}
                </p>
            </div>
        </div>
    )
}
