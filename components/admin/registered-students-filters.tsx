"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface RegisteredStudentsFiltersProps {
    searchTerm: string
    searchCPF: string
    status: string
    onSearchTermChange: (value: string) => void
    onSearchCPFChange: (value: string) => void
    onStatusChange: (value: string) => void
    onClear: () => void
}

const statusOptions = [
    { value: "ALL", label: "Todos os status" },
    { value: "AUTO_APROVADA", label: "Auto Aprovada" },
    { value: "APROVADA_MANUAL", label: "Aprovada Manualmente" },
]

export function RegisteredStudentsFilters({
    searchTerm,
    searchCPF,
    status,
    onSearchTermChange,
    onSearchCPFChange,
    onStatusChange,
    onClear,
}: RegisteredStudentsFiltersProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label htmlFor="searchName">Nome</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="searchName"
                                type="text"
                                placeholder="Buscar por nome..."
                                value={searchTerm}
                                onChange={(e) => onSearchTermChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="searchCPF">CPF</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="searchCPF"
                                type="text"
                                placeholder="Buscar por CPF..."
                                value={searchCPF}
                                onChange={(e) => onSearchCPFChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Button onClick={onClear} variant="outline" className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Limpar Filtros
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
