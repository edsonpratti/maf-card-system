"use client"

import { useEffect, useState } from "react"
import { AddStudentForm, ImportCSVForm } from "@/components/admin/student-forms"
import { getServiceSupabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { deleteStudent } from "@/app/actions/base-alunas"
import { Trash2 } from "lucide-react"
import { StudentBaseFilters } from "@/components/admin/student-base-filters"

type Student = {
    id: string
    name: string
    cpf: string
    created_at: string
    is_recognized: boolean
}

export default function BaseAlunasPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [searchCPF, setSearchCPF] = useState("")
    const [loading, setLoading] = useState(true)

    async function loadStudents() {
        setLoading(true)
        const supabase = getServiceSupabase()
        const { data } = await supabase
            .from("students_base")
            .select("*")
            .eq("is_recognized", true)
            .order("created_at", { ascending: false })
        setStudents(data || [])
        setFilteredStudents(data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadStudents()
    }, [])

    useEffect(() => {
        let filtered = students

        if (searchTerm) {
            filtered = filtered.filter((student) =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (searchCPF) {
            filtered = filtered.filter((student) =>
                student.cpf.replace(/\D/g, "").includes(searchCPF.replace(/\D/g, ""))
            )
        }

        setFilteredStudents(filtered)
    }, [searchTerm, searchCPF, students])

    const handleClear = () => {
        setSearchTerm("")
        setSearchCPF("")
    }

    const handleDelete = async (studentId: string) => {
        await deleteStudent(studentId)
        // Recarregar a lista após deletar
        await loadStudents()
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Base de Alunas Habilitadas</h1>
                <p className="text-muted-foreground">Alunas com habilitação reconhecida pelo sistema.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Adicionar Manualmente</h2>
                    <AddStudentForm onSuccess={loadStudents} />
                </div>
                <div className="space-y-4 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Importar em Massa</h2>
                    <ImportCSVForm onSuccess={loadStudents} />
                </div>
            </div>

            <StudentBaseFilters
                searchTerm={searchTerm}
                searchCPF={searchCPF}
                onSearchTermChange={setSearchTerm}
                onSearchCPFChange={setSearchCPF}
                onClear={handleClear}
            />

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
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.cpf}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            type="button"
                                            onClick={() => handleDelete(student.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    {searchTerm || searchCPF
                                        ? "Nenhuma aluna encontrada com os filtros aplicados."
                                        : "Nenhuma aluna cadastrada."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    <strong>Total de alunas habilitadas:</strong> {students.length}
                    {filteredStudents.length !== students.length && (
                        <> | <strong>Filtradas:</strong> {filteredStudents.length}</>
                    )}
                </p>
            </div>
        </div>
    )
}
