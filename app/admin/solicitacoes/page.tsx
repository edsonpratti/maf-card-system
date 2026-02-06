import { SearchParams } from "next/navigation"
import Link from "next/link"
import { getRequests } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function SolicitacoesPage({
    searchParams,
}: {
    searchParams: { status?: string }
}) {
    const status = searchParams.status || "ALL"
    const requests = await getRequests(status)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Solicitações</h1>
                <div className="space-x-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/solicitacoes?status=ALL">Todas</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/solicitacoes?status=PENDENTE_MANUAL">Pendentes</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/solicitacoes?status=APROVADA_MANUAL">Aprovadas</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/solicitacoes?status=RECUSADA">Recusadas</Link>
                    </Button>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
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
                                    <TableCell>
                                        <Badge variant={req.status === "PENDENTE_MANUAL" ? "destructive" : "default"}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/admin/solicitacoes/${req.id}`}>Ver Detalhes</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhuma solicitação encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
