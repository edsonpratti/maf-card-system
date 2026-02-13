"use client"

import { useEffect, useState, useCallback } from "react"
import { getRegisteredStudents, createUserManually } from "@/app/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RegisteredStudentsFilters } from "@/components/admin/registered-students-filters"
import StudentActions from "@/components/admin/student-actions"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings2, UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Student = {
    id: string
    name: string
    cpf: string
    email: string
    whatsapp: string | null
    address_json: any
    status: string
    card_number: string | null
    certificate_file_path: string | null
    card_pdf_path: string | null
    validation_token: string | null
    auth_user_id: string | null
    created_at: string
    issued_at: string | null
    updated_at: string
    is_disabled: boolean | null
}

type ColumnConfig = {
    key: string
    label: string
    visible: boolean
    defaultVisible: boolean
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
    { key: "name", label: "Nome", visible: true, defaultVisible: true },
    { key: "cpf", label: "CPF", visible: true, defaultVisible: true },
    { key: "email", label: "Email", visible: true, defaultVisible: true },
    { key: "whatsapp", label: "WhatsApp", visible: false, defaultVisible: false },
    { key: "address", label: "Endereço", visible: false, defaultVisible: false },
    { key: "card_number", label: "Nº Carteirinha", visible: true, defaultVisible: true },
    { key: "status", label: "Status", visible: true, defaultVisible: true },
    { key: "is_disabled", label: "Habilitado", visible: true, defaultVisible: true },
    { key: "certificate", label: "Certificado", visible: false, defaultVisible: false },
    { key: "card_pdf", label: "PDF Carteirinha", visible: false, defaultVisible: false },
    { key: "token", label: "Token", visible: false, defaultVisible: false },
    { key: "created_at", label: "Cadastro", visible: true, defaultVisible: true },
    { key: "issued_at", label: "Aprovação", visible: false, defaultVisible: false },
    { key: "updated_at", label: "Atualização", visible: false, defaultVisible: false },
    { key: "actions", label: "Ações", visible: true, defaultVisible: true },
]

const STORAGE_KEY = "usuarios_columns_config"

export default function AlunasCadastradasPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [searchCPF, setSearchCPF] = useState("")
    const [status, setStatus] = useState("ALL")
    const [loading, setLoading] = useState(true)
    const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
    
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newUser, setNewUser] = useState({
        name: "",
        cpf: "",
        email: "",
        whatsapp: "",
        sendEmail: true
    })

    useEffect(() => {
        const savedColumns = localStorage.getItem(STORAGE_KEY)
        if (savedColumns) {
            try {
                const parsed = JSON.parse(savedColumns)
                const merged = DEFAULT_COLUMNS.map(col => {
                    const saved = parsed.find((p: ColumnConfig) => p.key === col.key)
                    return saved ? { ...col, visible: saved.visible } : col
                })
                setColumns(merged)
            } catch (e) {
                console.error("Erro ao carregar configuração de colunas:", e)
            }
        }
    }, [])

    const saveColumns = useCallback((newColumns: ColumnConfig[]) => {
        setColumns(newColumns)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns))
    }, [])

    const toggleColumn = (key: string) => {
        const newColumns = columns.map(col => 
            col.key === key ? { ...col, visible: !col.visible } : col
        )
        saveColumns(newColumns)
    }

    const resetColumns = () => {
        const resetCols = columns.map(col => ({ ...col, visible: col.defaultVisible }))
        saveColumns(resetCols)
    }

    const loadStudents = useCallback(async () => {
        setLoading(true)
        const data = await getRegisteredStudents()
        setStudents(data)
        setFilteredStudents(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        loadStudents()
    }, [loadStudents])

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

        if (status !== "ALL") {
            filtered = filtered.filter((student) => student.status === status)
        }

        setFilteredStudents(filtered)
    }, [searchTerm, searchCPF, status, students])

    const handleClear = () => {
        setSearchTerm("")
        setSearchCPF("")
        setStatus("ALL")
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const result = await createUserManually(newUser)
            if (result.success) {
                toast.success(result.message)
                setCreateModalOpen(false)
                setNewUser({ name: "", cpf: "", email: "", whatsapp: "", sendEmail: true })
                loadStudents()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Erro ao criar usuário")
        } finally {
            setCreating(false)
        }
    }

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, "")
        return numbers
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})/, "$1-$2")
            .substring(0, 14)
    }

    const isColumnVisible = (key: string) => 
        columns.find(c => c.key === key)?.visible ?? true

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold">Usuários</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Todos os usuários que definiram senha e têm acesso ao sistema.
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">Criar Usuário</span>
                                <span className="sm:hidden">Criar</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Criar Novo Usuário</DialogTitle>
                                <DialogDescription>
                                    Crie um usuário manualmente e opcionalmente envie o email de primeiro acesso.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nome Completo *</Label>
                                        <Input
                                            id="name"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            placeholder="Nome completo"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="cpf">CPF *</Label>
                                        <Input
                                            id="cpf"
                                            value={newUser.cpf}
                                            onChange={(e) => setNewUser({ ...newUser, cpf: formatCPF(e.target.value) })}
                                            placeholder="000.000.000-00"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="email@exemplo.com"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                                        <Input
                                            id="whatsapp"
                                            value={newUser.whatsapp}
                                            onChange={(e) => setNewUser({ ...newUser, whatsapp: e.target.value })}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="sendEmail"
                                            checked={newUser.sendEmail}
                                            onCheckedChange={(checked) => 
                                                setNewUser({ ...newUser, sendEmail: checked as boolean })
                                            }
                                        />
                                        <Label htmlFor="sendEmail" className="text-sm font-normal">
                                            Enviar email de primeiro acesso
                                        </Label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={creating}>
                                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Criar Usuário
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Settings2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Colunas</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {columns.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.key}
                                    checked={column.visible}
                                    onCheckedChange={() => toggleColumn(column.key)}
                                >
                                    {column.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1.5">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full justify-start text-xs"
                                    onClick={resetColumns}
                                >
                                    Restaurar Padrão
                                </Button>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <RegisteredStudentsFilters
                searchTerm={searchTerm}
                searchCPF={searchCPF}
                status={status}
                onSearchTermChange={setSearchTerm}
                onSearchCPFChange={setSearchCPF}
                onStatusChange={setStatus}
                onClear={handleClear}
            />

            {/* Mobile Cards */}
            <div className="block lg:hidden space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                        <div 
                            key={student.id} 
                            className={`border rounded-lg p-4 space-y-3 bg-card ${student.is_disabled ? "opacity-60" : ""}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <p className="font-semibold truncate">{student.name}</p>
                                    <p className="text-sm text-muted-foreground">{student.cpf}</p>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                        {student.status === "AUTO_APROVADA" ? (
                                            <Badge variant="default">Auto Aprovada</Badge>
                                        ) : student.status === "APROVADA_MANUAL" ? (
                                            <Badge variant="default">Aprovada</Badge>
                                        ) : student.status === "PENDENTE_MANUAL" ? (
                                            <Badge variant="secondary">Pendente</Badge>
                                        ) : student.status === "REJEITADA" ? (
                                            <Badge variant="destructive">Rejeitada</Badge>
                                        ) : (
                                            <Badge variant="outline">{student.status}</Badge>
                                        )}
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">WhatsApp</p>
                                    <p>{student.whatsapp || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Nº Carteirinha</p>
                                    <p>{student.card_number || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Cadastro</p>
                                    <p>{new Date(student.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t">
                                <div className="ml-auto">
                                    <StudentActions student={student} onUpdate={loadStudents} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchTerm || searchCPF || status !== "ALL"
                            ? "Nenhum usuário encontrado."
                            : "Nenhum usuário cadastrado."}
                    </div>
                )}
            </div>

            {/* Desktop Table */}
            <div className="border rounded-md overflow-x-auto hidden lg:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {isColumnVisible("name") && <TableHead>Nome</TableHead>}
                            {isColumnVisible("cpf") && <TableHead>CPF</TableHead>}
                            {isColumnVisible("email") && <TableHead>Email</TableHead>}
                            {isColumnVisible("whatsapp") && <TableHead>WhatsApp</TableHead>}
                            {isColumnVisible("address") && <TableHead>Endereço</TableHead>}
                            {isColumnVisible("card_number") && <TableHead>Nº Carteirinha</TableHead>}
                            {isColumnVisible("status") && <TableHead>Status</TableHead>}
                            {isColumnVisible("is_disabled") && <TableHead>Habilitado</TableHead>}
                            {isColumnVisible("certificate") && <TableHead>Certificado</TableHead>}
                            {isColumnVisible("card_pdf") && <TableHead>PDF Carteirinha</TableHead>}
                            {isColumnVisible("token") && <TableHead>Token</TableHead>}
                            {isColumnVisible("created_at") && <TableHead>Cadastro</TableHead>}
                            {isColumnVisible("issued_at") && <TableHead>Aprovação</TableHead>}
                            {isColumnVisible("updated_at") && <TableHead>Atualização</TableHead>}
                            {isColumnVisible("actions") && <TableHead>Ações</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={15} className="text-center h-24">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow 
                                    key={student.id}
                                    className={student.is_disabled ? "opacity-60" : ""}
                                >
                                    {isColumnVisible("name") && (
                                        <TableCell className="font-medium whitespace-nowrap">{student.name}</TableCell>
                                    )}
                                    {isColumnVisible("cpf") && (
                                        <TableCell className="whitespace-nowrap">{student.cpf}</TableCell>
                                    )}
                                    {isColumnVisible("email") && (
                                        <TableCell className="whitespace-nowrap">{student.email}</TableCell>
                                    )}
                                    {isColumnVisible("whatsapp") && (
                                        <TableCell className="whitespace-nowrap">{student.whatsapp || '-'}</TableCell>
                                    )}
                                    {isColumnVisible("address") && (
                                        <TableCell className="max-w-xs">
                                            {student.address_json && Object.keys(student.address_json).length > 0 ? (
                                                <div className="text-xs">
                                                    {student.address_json.street && <div>{student.address_json.street}</div>}
                                                    {student.address_json.city && student.address_json.state && (
                                                        <div>{student.address_json.city} - {student.address_json.state}</div>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                    )}
                                    {isColumnVisible("card_number") && (
                                        <TableCell className="whitespace-nowrap">{student.card_number || '-'}</TableCell>
                                    )}
                                    {isColumnVisible("status") && (
                                        <TableCell>
                                            {student.status === "AUTO_APROVADA" ? (
                                                <Badge variant="default">Auto Aprovada</Badge>
                                            ) : student.status === "APROVADA_MANUAL" ? (
                                                <Badge variant="default">Aprovada</Badge>
                                            ) : student.status === "PENDENTE_MANUAL" ? (
                                                <Badge variant="secondary">Pendente</Badge>
                                            ) : student.status === "REJEITADA" ? (
                                                <Badge variant="destructive">Rejeitada</Badge>
                                            ) : (
                                                <Badge variant="outline">{student.status}</Badge>
                                            )}
                                        </TableCell>
                                    )}
                                    {isColumnVisible("is_disabled") && (
                                        <TableCell>
                                            {student.is_disabled ? (
                                                <Badge variant="destructive">Desabilitado</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>
                                            )}
                                        </TableCell>
                                    )}
                                    {isColumnVisible("certificate") && (
                                        <TableCell className="whitespace-nowrap">
                                            {student.certificate_file_path ? (
                                                <a 
                                                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${student.certificate_file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-xs"
                                                >
                                                    Ver Arquivo
                                                </a>
                                            ) : '-'}
                                        </TableCell>
                                    )}
                                    {isColumnVisible("card_pdf") && (
                                        <TableCell className="whitespace-nowrap">
                                            {student.card_pdf_path ? (
                                                <a 
                                                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${student.card_pdf_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-xs"
                                                >
                                                    Ver PDF
                                                </a>
                                            ) : '-'}
                                        </TableCell>
                                    )}
                                    {isColumnVisible("token") && (
                                        <TableCell className="whitespace-nowrap font-mono text-xs">
                                            {student.validation_token || '-'}
                                        </TableCell>
                                    )}
                                    {isColumnVisible("created_at") && (
                                        <TableCell className="whitespace-nowrap">
                                            {new Date(student.created_at).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                    )}
                                    {isColumnVisible("issued_at") && (
                                        <TableCell className="whitespace-nowrap">
                                            {student.issued_at 
                                                ? new Date(student.issued_at).toLocaleDateString('pt-BR')
                                                : '-'
                                            }
                                        </TableCell>
                                    )}
                                    {isColumnVisible("updated_at") && (
                                        <TableCell className="whitespace-nowrap">
                                            {new Date(student.updated_at).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                    )}
                                    {isColumnVisible("actions") && (
                                        <TableCell className="whitespace-nowrap">
                                            <StudentActions student={student} onUpdate={loadStudents} />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={15} className="text-center h-24">
                                    {searchTerm || searchCPF || status !== "ALL"
                                        ? "Nenhum usuário encontrado com os filtros aplicados."
                                        : "Nenhum usuário com acesso definido no sistema."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    <strong>Total de usuários com acesso:</strong> {students.length}
                    {filteredStudents.length !== students.length && (
                        <> | <strong>Filtrados:</strong> {filteredStudents.length}</>
                    )}
                </p>
            </div>
        </div>
    )
}
