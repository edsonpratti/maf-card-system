"use client"

import { useEffect, useState } from "react"
import { getRegisteredStudents } from "@/app/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RegisteredStudentsFilters } from "@/components/admin/registered-students-filters"

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
    created_at: string
    issued_at: string | null
    updated_at: string
}

export default function AlunasCadastradasPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [searchCPF, setSearchCPF] = useState("")
    const [status, setStatus] = useState("ALL")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStudents() {
            setLoading(true)
            const data = await getRegisteredStudents()
            setStudents(data)
            setFilteredStudents(data)
            setLoading(false)
        }
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

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Alunas Cadastradas</h1>
                <p className="text-muted-foreground">
                    Alunas que fizeram login no sistema e tiveram seu acesso autorizado.
                </p>
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

            <div className="border rounded-md overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead>Nº Carteirinha</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Certificado</TableHead>
                            <TableHead>PDF Carteirinha</TableHead>
                            <TableHead>Token</TableHead>
                            <TableHead>Cadastro</TableHead>
                            <TableHead>Aprovação</TableHead>
                            <TableHead>Atualização</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={13} className="text-center h-24">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{student.name}</TableCell>
                                    <TableCell className="whitespace-nowrap">{student.cpf}</TableCell>
                                    <TableCell className="whitespace-nowrap">{student.email}</TableCell>
                                    <TableCell className="whitespace-nowrap">{student.whatsapp || '-'}</TableCell>
                                    <TableCell className="max-w-xs">
                                        {student.address_json && Object.keys(student.address_json).length > 0 ? (
                                            <div className="text-xs">
                                                {student.address_json.street && <div>{student.address_json.street}</div>}
                                                {student.address_json.number && <div>Nº {student.address_json.number}</div>}
                                                {student.address_json.complement && <div>{student.address_json.complement}</div>}
                                                {student.address_json.neighborhood && <div>{student.address_json.neighborhood}</div>}
                                                {student.address_json.city && student.address_json.state && (
                                                    <div>{student.address_json.city} - {student.address_json.state}</div>
                                                )}
                                                {student.address_json.zipCode && <div>CEP: {student.address_json.zipCode}</div>}
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">{student.card_number || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={student.status === "AUTO_APROVADA" ? "default" : "secondary"}>
                                            {student.status === "AUTO_APROVADA" ? "Auto Aprovada" : "Aprovada Manualmente"}
                                        </Badge>
                                    </TableCell>
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
                                    <TableCell className="whitespace-nowrap font-mono text-xs">
                                        {student.validation_token || '-'}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {new Date(student.created_at).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {student.issued_at 
                                            ? new Date(student.issued_at).toLocaleDateString('pt-BR')
                                            : '-'
                                        }
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {new Date(student.updated_at).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={13} className="text-center h-24">
                                    {searchTerm || searchCPF || status !== "ALL"
                                        ? "Nenhuma aluna encontrada com os filtros aplicados."
                                        : "Nenhuma aluna cadastrada e autorizada no sistema."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    <strong>Total de alunas autorizadas:</strong> {students.length}
                    {filteredStudents.length !== students.length && (
                        <> | <strong>Filtradas:</strong> {filteredStudents.length}</>
                    )}
                </p>
            </div>
        </div>
    )
}
