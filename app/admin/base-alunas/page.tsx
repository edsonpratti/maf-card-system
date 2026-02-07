import { AddStudentForm, ImportCSVForm } from "@/components/admin/student-forms"
import { getServiceSupabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { deleteStudent } from "@/app/actions/base-alunas"
import { Trash2 } from "lucide-react"

async function getStudents() {
    const supabase = getServiceSupabase()
    // Filtra apenas alunas habilitadas/reconhecidas
    const { data } = await supabase
        .from("students_base")
        .select("*")
        .eq("is_recognized", true)
        .order("created_at", { ascending: false })
        .limit(50)
    return data || []
}

export default async function BaseAlunasPage() {
    const students = await getStudents()

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Base de Alunas Habilitadas</h1>
            <p className="text-muted-foreground">Alunas com habilitação reconhecida pelo sistema.</p>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Adicionar Manualmente</h2>
                    <AddStudentForm />
                </div>
                <div className="space-y-4 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Importar em Massa</h2>
                    <ImportCSVForm />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length > 0 ? (
                            students.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.cpf}</TableCell>
                                    <TableCell className="text-right">
                                        <form action={deleteStudent.bind(null, student.id)}>
                                            <Button variant="ghost" size="icon" type="submit">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">Nenhuma aluna cadastrada.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
