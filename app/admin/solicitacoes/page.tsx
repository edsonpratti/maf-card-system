
import Link from "next/link"
import { getRequests } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RequestFilters } from "@/components/admin/request-filters"

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
    
    const requests = await getRequests(filters)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Solicitações</h1>
            </div>

            <RequestFilters />

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
