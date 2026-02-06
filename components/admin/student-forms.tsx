"use client"

import { useState } from "react"
import { addStudent, importCSV } from "@/app/actions/base-alunas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function AddStudentForm() {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            const res = await addStudent(null, formData)
            if (res.success) {
                toast.success(res.message)
                e.currentTarget.reset()
            } else {
                toast.error(res.message)
            }
        } catch {
            toast.error("Erro ao adicionar")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="name">Nome Completo</Label>
                <Input type="text" id="name" name="name" placeholder="Nome" required />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input type="text" id="cpf" name="cpf" placeholder="000.000.000-00" required />
            </div>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar
            </Button>
        </form>
    )
}

export function ImportCSVForm() {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            const res = await importCSV(null, formData) // Assuming direct server action call
            if (res.success) {
                toast.success(res.message)
                e.currentTarget.reset()
            } else {
                toast.error(res.message)
            }
        } catch {
            toast.error("Erro ao importar")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="file">Importar CSV (nome,cpf)</Label>
                <Input id="file" name="file" type="file" accept=".csv" required />
            </div>
            <Button type="submit" variant="secondary" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar
            </Button>
        </form>
    )
}
