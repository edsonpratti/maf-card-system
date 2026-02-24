import { getAuditLogs, createTestLog } from "@/app/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AuditLogFilters } from "@/components/admin/audit-log-filters"

async function TestLogButton() {
    "use server"
    async function handleCreateTestLog() {
        "use server"
        await createTestLog()
    }

    return (
        <form action={handleCreateTestLog}>
            <Button type="submit" variant="outline" size="sm">
                🧪 Criar Log de Teste
            </Button>
        </form>
    )
}

const actionLabels: Record<string, string> = {
    APROVADA_MANUAL: "Aprovação Manual",
    AUTO_APROVADA: "Aprovação Automática",
    RECUSADA: "Recusa",
    REVOGADA: "Revogação",
    UPLOAD_CSV: "Upload CSV",
    PENDENTE_MANUAL: "Pendente Manual",
    ADD_STUDENT: "Adicionar Aluna",
    DELETE_STUDENT: "Remover Aluna",
    DELETE_REQUEST: "Excluir Solicitação",
    TESTE_SISTEMA: "Teste do Sistema",
}

const actionColors: Record<string, "success" | "info" | "warning" | "destructive" | "secondary" | "outline" | "outline-success" | "outline-destructive" | "outline-warning" | "outline-info"> = {
    APROVADA_MANUAL: "info",
    AUTO_APROVADA: "success",
    RECUSADA: "destructive",
    REVOGADA: "outline-destructive",
    UPLOAD_CSV: "secondary",
    PENDENTE_MANUAL: "warning",
    ADD_STUDENT: "outline-success",
    DELETE_STUDENT: "destructive",
    DELETE_REQUEST: "destructive",
    TESTE_SISTEMA: "secondary",
}

function formatDate(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo',
    }).format(date)
}

export default async function AuditLogsPage({
    searchParams,
}: {
    searchParams: { action?: string; startDate?: string; endDate?: string }
}) {
    const logs = await getAuditLogs({
        action: searchParams.action,
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
    })

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Logs de Auditoria</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                        Histórico de todas as ações administrativas realizadas no sistema
                    </p>
                </div>
                <TestLogButton />
            </div>

            <AuditLogFilters />

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Ações</CardTitle>
                    <CardDescription>
                        Total de {logs.length} registro(s) encontrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhum log encontrado
                        </div>
                    ) : (
                        <>
                            {/* Visualização em Cards para Mobile */}
                            <div className="block md:hidden space-y-3">
                                {logs.map((log: any) => (
                                    <div key={log.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge variant={actionColors[log.action] || "outline"}>
                                                {actionLabels[log.action] || log.action}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium">{log.users_cards?.name || "-"}</span>
                                            <span className="text-muted-foreground ml-2 text-xs">
                                                {log.users_cards?.cpf || ""}
                                            </span>
                                        </div>
                                        {(log.metadata?.reason || log.metadata) && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {log.metadata?.reason || JSON.stringify(log.metadata)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Tabela para Desktop */}
                            <div className="rounded-md border hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data/Hora</TableHead>
                                        <TableHead>Ação</TableHead>
                                        <TableHead>Usuária</TableHead>
                                        <TableHead>CPF</TableHead>
                                        <TableHead>Detalhes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log: any) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-sm">
                                                {formatDate(log.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={actionColors[log.action] || "outline"}>
                                                    {actionLabels[log.action] || log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.users_cards?.name || "-"}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {log.users_cards?.cpf || "-"}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {log.metadata?.reason && (
                                                    <span className="text-sm text-muted-foreground">
                                                        {log.metadata.reason}
                                                    </span>
                                                )}
                                                {!log.metadata?.reason && log.metadata && (
                                                    <span className="text-sm text-muted-foreground">
                                                        {JSON.stringify(log.metadata)}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
