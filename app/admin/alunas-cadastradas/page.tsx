import { getRegisteredStudents } from "@/app/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function AlunasCadastradasPage() {
    const students = await getRegisteredStudents()

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Alunas Cadastradas</h1>
                <p className="text-muted-foreground">
                    Alunas que fizeram login no sistema e tiveram seu acesso autorizado.
                </p>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data de Cadastro</TableHead>
                            <TableHead>Data de Aprovação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length > 0 ? (
                            students.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>{student.cpf}</TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={student.status === "AUTO_APROVADA" ? "default" : "secondary"}>
                                            {student.status === "AUTO_APROVADA" ? "Auto Aprovada" : "Aprovada Manualmente"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(student.created_at).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        {student.issued_at 
                                            ? new Date(student.issued_at).toLocaleDateString('pt-BR')
                                            : '-'
                                        }
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    Nenhuma aluna cadastrada e autorizada no sistema.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    <strong>Total de alunas autorizadas:</strong> {students.length}
                </p>
            </div>
        </div>
    )
}
