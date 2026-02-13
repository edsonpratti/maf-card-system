"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const actionOptions = [
    { value: "ALL", label: "Todas as ações" },
    { value: "APROVADA_MANUAL", label: "Aprovação Manual" },
    { value: "AUTO_APROVADA", label: "Aprovação Automática" },
    { value: "RECUSADA", label: "Recusa" },
    { value: "REVOGADA", label: "Revogação" },
    { value: "UPLOAD_CSV", label: "Upload CSV" },
    { value: "PENDENTE_MANUAL", label: "Pendente Manual" },
]

export function AuditLogFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [action, setAction] = useState(searchParams.get("action") || "ALL")
    const [startDate, setStartDate] = useState(searchParams.get("startDate") || "")
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "")

    const handleFilter = () => {
        const params = new URLSearchParams()
        
        if (action && action !== "ALL") {
            params.set("action", action)
        }
        
        if (startDate) {
            params.set("startDate", startDate)
        }
        
        if (endDate) {
            params.set("endDate", endDate)
        }
        
        router.push(`/admin/logs?${params.toString()}`)
    }

    const handleClear = () => {
        setAction("ALL")
        setStartDate("")
        setEndDate("")
        router.push("/admin/logs")
    }

    return (
        <Card>
            <CardContent className="p-4 sm:pt-6">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <Label htmlFor="action">Ação</Label>
                        <select
                            id="action"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {actionOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="startDate">Data Inicial</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endDate">Data Final</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <div className="flex gap-2">
                            <Button onClick={handleFilter} className="flex-1">
                                Filtrar
                            </Button>
                            <Button onClick={handleClear} variant="outline">
                                Limpar
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
