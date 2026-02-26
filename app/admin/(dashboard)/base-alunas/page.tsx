"use client"

import { useEffect, useState, useCallback } from "react"
import { AddStudentForm, ImportCSVForm } from "@/components/admin/student-forms"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteStudent, updateStudent, getStudentsBase } from "@/app/actions/base-alunas"
import { Trash2, Pencil, Globe, ChevronLeft, ChevronRight } from "lucide-react"
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

const PAGE_SIZE = 50

export default function BaseAlunasPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [total, setTotal] = useState(0)
    const [totalBrazilians, setTotalBrazilians] = useState(0)
    const [totalForeigners, setTotalForeigners] = useState(0)
    const [page, setPage] = useState(1)
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

    const loadStudents = useCallback(async (p: number, search: string, searchCpf: string) => {
        setLoading(true)
        const result = await getStudentsBase({ page: p, pageSize: PAGE_SIZE, search, searchCPF: searchCpf })
        setStudents(result.data as Student[])
        setTotal(result.total)
        setTotalBrazilians(result.totalBrazilians)
        setTotalForeigners(result.totalForeigners)
        setLoading(false)
    }, [])

    // Debounce para busca
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1)
            loadStudents(1, searchTerm, searchCPF)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchTerm, searchCPF, loadStudents])

    useEffect(() => {
        loadStudents(page, searchTerm, searchCPF)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

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
        await loadStudents(page, searchTerm, searchCPF)
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
            await loadStudents(page, searchTerm, searchCPF)
        } else {
            toast.error(result.message)
        }
    }

    const formatCPF = (cpf: string | null) => {
        if (!cpf) return "—"
        const cleaned = cpf.replace(/\D/g, "")
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold">Base de Alunas Habilitadas</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Alunas com habilitação reconhecida pelo sistema. CPFs (ou emails para estrangeiras) cadastrados aqui são aprovados automaticamente.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:shrink-0">
                    <div className="rounded-lg border bg-card px-4 py-3 text-center min-w-[90px]">
                        <p className="text-2xl font-bold">{loading ? "…" : (totalBrazilians + totalForeigners)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Total</p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3 text-center min-w-[90px]">
                        <p className="text-2xl font-bold">{loading ? "…" : totalBrazilians}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Brasileiras</p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3 text-center min-w-[90px]">
                        <p className="text-2xl font-bold">{loading ? "…" : totalForeigners}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Estrangeiras</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:gap-8 md:grid-cols-2">
                <div className="space-y-4 rounded-lg border p-3 sm:p-4">
                    <h2 className="text-base sm:text-lg font-semibold">Adicionar Manualmente</h2>
                    <AddStudentForm onSuccess={() => loadStudents(page, searchTerm, searchCPF)} />
                </div>
                <div className="space-y-4 rounded-lg border p-3 sm:p-4">
                    <h2 className="text-base sm:text-lg font-semibold">Importar em Massa</h2>
                    <ImportCSVForm onSuccess={() => { setPage(1); loadStudents(1, searchTerm, searchCPF) }} />
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
                ) : students.length > 0 ? (
                    students.map((student) => (
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
                        ) : students.length > 0 ? (
                            students.map((student) => (
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
                                    <TableCell>{new Date(student.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</TableCell>
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

            {/* Paginação */}
            {!loading && totalPages > 0 && (
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                        {total === 0
                            ? "Nenhum resultado"
                            : `Exibindo ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total} aluna${total !== 1 ? "s" : ""}`
                        }
                        {(searchTerm || searchCPF) && " (filtrado)"}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm px-2">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

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


