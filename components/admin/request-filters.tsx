"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const statusOptions = [
    { value: "ALL", label: "Todos os status" },
    { value: "PENDENTE_MANUAL", label: "Pendente Manual" },
    { value: "APROVADA_MANUAL", label: "Aprovada Manual" },
    { value: "AUTO_APROVADA", label: "Auto Aprovada" },
    { value: "RECUSADA", label: "Recusada" },
]

export function RequestFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [status, setStatus] = useState(searchParams.get("status") || "ALL")
    const [searchName, setSearchName] = useState(searchParams.get("name") || "")
    const [searchCpf, setSearchCpf] = useState(searchParams.get("cpf") || "")
    const [startDate, setStartDate] = useState(searchParams.get("startDate") || "")
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "")

    const handleFilter = () => {
        const params = new URLSearchParams()
        
        if (status && status !== "ALL") {
            params.set("status", status)
        }
        
        if (searchName.trim()) {
            params.set("name", searchName.trim())
        }
        
        if (searchCpf.trim()) {
            params.set("cpf", searchCpf.trim())
        }
        
        if (startDate) {
            params.set("startDate", startDate)
        }
        
        if (endDate) {
            params.set("endDate", endDate)
        }
        
        router.push(`/admin/solicitacoes?${params.toString()}`)
    }

    const handleClear = () => {
        setStatus("ALL")
        setSearchName("")
        setSearchCpf("")
        setStartDate("")
        setEndDate("")
        router.push("/admin/solicitacoes")
    }

    return (
        <Card>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="status" className="text-sm">Status</Label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full h-10 sm:h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="name" className="text-sm">Nome</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="cpf" className="text-sm">CPF</Label>
                        <Input
                            id="cpf"
                            type="text"
                            placeholder="Buscar por CPF..."
                            value={searchCpf}
                            onChange={(e) => setSearchCpf(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="startDate" className="text-sm">Data Inicial</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="endDate" className="text-sm">Data Final</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 flex items-end">
                        <div className="flex gap-2 w-full">
                            <Button 
                                onClick={handleFilter} 
                                className="flex-1 h-10"
                            >
                                Filtrar
                            </Button>
                            <Button 
                                onClick={handleClear} 
                                variant="outline"
                                className="flex-1 h-10"
                            >
                                Limpar
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
