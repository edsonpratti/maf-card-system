"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface StudentBaseFiltersProps {
    searchTerm: string
    searchCPF: string
    onSearchTermChange: (value: string) => void
    onSearchCPFChange: (value: string) => void
    onClear: () => void
}

export function StudentBaseFilters({
    searchTerm,
    searchCPF,
    onSearchTermChange,
    onSearchCPFChange,
    onClear,
}: StudentBaseFiltersProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-3">
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
