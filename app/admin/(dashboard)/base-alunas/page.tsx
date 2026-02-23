"use client"

import { useEffect, useState } from "react"
import { AddStudentForm, ImportCSVForm } from "@/components/admin/student-forms"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteStudent, updateStudent, getStudentsBase } from "@/app/actions/base-alunas"
import { Trash2, Pencil, Globe } from "lucide-react"
import { StudentBaseFilters } from "@/components/admin/student-base-filters"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type Student = {
    id: string
    name: string
    cpf: string | null
    email: string | null
    is_foreign: boolean
    created_at: string
    is_recognized: boolean
}

export default function BaseAlunasPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [searchCPF, setSearchCPF] = useState("")
    const [loading, setLoading] = useState(true)
    
    // Estados para edição
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)
    const [editName, setEditName] = useState("")
    const [editCpf, setEditCpf] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [editIsForeign, setEditIsForeign] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    
    // Estado para confirmação de exclusão
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)

    async function loadStudents() {
        setLoading(true)
        const data = await getStudentsBase()
        setStudents(data)
        setFilteredStudents(data)
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
                (student.cpf?.replace(/\D/g, "") ?? "").includes(searchCPF.replace(/\D/g, "")) ||
                (student.email ?? "").toLowerCase().includes(searchCPF.toLowerCase())
            )
        }

        setFilteredStudents(filtered)
    }, [searchTerm, searchCPF, students])

    const handleClear = () => {
        setSearchTerm("")
        setSearchCPF("")
    }

    const handleDeleteClick = (student: Student) => {
        setStudentToDelete(student)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return
        await deleteStudent(studentToDelete.id)
        setDeleteDialogOpen(false)
        setStudentToDelete(null)
        toast.success("Aluna removida da base com sucesso!")
        await loadStudents()
    }

    const handleEditClick = (student: Student) => {
        setEditingStudent(student)
        setEditName(student.name)
        setEditCpf(student.cpf ?? "")
        setEditEmail(student.email ?? "")
        setEditIsForeign(student.is_foreign)
        setEditDialogOpen(true)
    }

    const handleEditSave = async () => {
        if (!editingStudent) return
        
        setSaving(true)
        const result = await updateStudent(editingStudent.id, editName, editCpf, editEmail, editIsForeign)
        setSaving(false)
        
        if (result.success) {
            toast.success(result.message)
            setEditDialogOpen(false)
            setEditingStudent(null)
            await loadStudents()
        } else {
            toast.error(result.message)
        }
    }

    const formatCPF = (cpf: string | null) => {
        if (!cpf) return "—"
        const cleaned = cpf.replace(/\D/g, "")
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }

    const foreignCount = students.filter((s) => s.is_foreign).length

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold">Base de Alunas Habilitadas</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Alunas com habilitação reconhecida pelo sistema. CPFs (ou emails para estrangeiras) cadastrados aqui são aprovados automaticamente.
                </p>
            </div>

            <div className="grid gap-4 sm:gap-8 md:grid-cols-2">
                <div className="space-y-4 rounded-lg border p-3 sm:p-4">
                    <h2 className="text-base sm:text-lg font-semibold">Adicionar Manualmente</h2>
                    <AddStudentForm onSuccess={loadStudents} />
                </div>
                <div className="space-y-4 rounded-lg border p-3 sm:p-4">
                    <h2 className="text-base sm:text-lg font-semibold">Importar em Massa</h2>
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

            {/* Visualização em Cards para Mobile */}
            <div className="block md:hidden space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                        <div key={student.id} className="border rounded-lg p-4 bg-card flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium truncate">{student.name}</p>
                                    {student.is_foreign && (
                                        <Badge variant="secondary" className="text-xs flex items-center gap-1 shrink-0">
                                            <Globe className="h-3 w-3" />
                                            Estrangeira
                                        </Badge>
                                    )}
                                </div>
                                {student.is_foreign ? (
                                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{formatCPF(student.cpf)}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    type="button"
                                    onClick={() => handleEditClick(student)}
                                    title="Editar"
                                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    type="button"
                                    onClick={() => handleDeleteClick(student)}
                                    title="Excluir"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchTerm || searchCPF
                            ? "Nenhuma aluna encontrada."
                            : "Nenhuma aluna cadastrada."}
                    </div>
                )}
            </div>

            {/* Tabela para Desktop */}
            <div className="border rounded-md hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF / Email</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Cadastro</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {student.is_foreign
                                            ? student.email
                                            : formatCPF(student.cpf)
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {student.is_foreign ? (
                                            <Badge variant="secondary" className="flex items-center gap-1 w-fit text-xs">
                                                <Globe className="h-3 w-3" />
                                                Estrangeira
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs">Brasileira</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(student.created_at).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                type="button"
                                                onClick={() => handleEditClick(student)}
                                                title="Editar"
                                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                type="button"
                                                onClick={() => handleDeleteClick(student)}
                                                title="Excluir"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
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
                    {foreignCount > 0 && (
                        <> | <strong>Estrangeiras:</strong> {foreignCount}</>
                    )}
                    {filteredStudents.length !== students.length && (
                        <> | <strong>Filtradas:</strong> {filteredStudents.length}</>
                    )}
                </p>
            </div>

            {/* Dialog de Edição */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Aluna</DialogTitle>
                        <DialogDescription>
                            Altere os dados da aluna na base de habilitadas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome Completo</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Nome completo da aluna"
                            />
                        </div>
                        {/* Toggle estrangeira */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setEditIsForeign(!editIsForeign)}
                                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors ${
                                    editIsForeign
                                        ? "bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400"
                                        : "border-border text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Globe className="h-3.5 w-3.5" />
                                {editIsForeign ? "Estrangeira ✓" : "Estrangeira (sem CPF)"}
                            </button>
                        </div>
                        {!editIsForeign ? (
                            <div className="space-y-2">
                                <Label htmlFor="edit-cpf">CPF</Label>
                                <Input
                                    id="edit-cpf"
                                    value={editCpf}
                                    onChange={(e) => setEditCpf(e.target.value)}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email de compra</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="email@compra.com"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="success" onClick={handleEditSave} disabled={saving}>
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja remover <strong>{studentToDelete?.name}</strong> da base de alunas habilitadas?
                            <br /><br />
                            <span className="text-yellow-600 dark:text-yellow-400">
                                Atenção: Esta ação não pode ser desfeita. {studentToDelete?.is_foreign ? "O email" : "O CPF"} não será mais aprovado automaticamente.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


