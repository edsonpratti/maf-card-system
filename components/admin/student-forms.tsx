"use client"

import { useState } from "react"
import { addStudent, importCSV } from "@/app/actions/base-alunas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Globe } from "lucide-react"

interface StudentFormProps {
    onSuccess?: () => void
}

export function AddStudentForm({ onSuccess }: StudentFormProps) {
    const [loading, setLoading] = useState(false)
    const [isForeign, setIsForeign] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        formData.set("is_foreign", isForeign ? "true" : "false")
        try {
            const res = await addStudent(null, formData)
            if (res?.success) {
                toast.success(res.message)
                e.currentTarget.reset()
                setIsForeign(false)
                onSuccess?.()
            } else {
                toast.error(res?.message || "Erro desconhecido ao adicionar aluna")
            }
        } catch (error) {
            console.error("Erro ao adicionar aluna:", error)
            toast.error("Erro de rede ao adicionar aluna. Verifique sua conexão.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Toggle estrangeira */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setIsForeign(!isForeign)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors ${
                        isForeign
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                            : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Globe className="h-3.5 w-3.5" />
                    {isForeign ? "Estrangeira ✓" : "Estrangeira (sem CPF)"}
                </button>
            </div>

            <div className="flex gap-4 items-end">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input type="text" id="name" name="name" placeholder="Nome" required />
                </div>
                {!isForeign ? (
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input type="text" id="cpf" name="cpf" placeholder="000.000.000-00" required={!isForeign} />
                    </div>
                ) : (
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="email">Email de compra</Label>
                        <Input type="email" id="email" name="email" placeholder="email@compra.com" required={isForeign} />
                    </div>
                )}
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adicionar
                </Button>
            </div>
        </form>
    )
}

export function ImportCSVForm({ onSuccess }: StudentFormProps) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            const res = await importCSV(null, formData)
            if (res.success) {
                toast.success(res.message)
                e.currentTarget.reset()
                onSuccess?.()
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
        <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="file">Importar CSV</Label>
                <p className="text-xs text-muted-foreground">
                    O sistema detecta automaticamente a ordem das colunas pelo cabeçalho.<br />
                    Formatos suportados (vírgula <em>ou</em> ponto-e-vírgula):<br />
                    <code className="font-mono bg-muted px-1 rounded">nome,cpf,email</code> &nbsp;·&nbsp;
                    <code className="font-mono bg-muted px-1 rounded">nome,email,cpf</code>
                    &nbsp;(ex: exportação Hotmart)<br />
                    Para estrangeiras, deixe o CPF em branco e preencha o email.
                </p>
                <Input id="file" name="file" type="file" accept=".csv" required />
            </div>
            <Button type="submit" variant="secondary" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar
            </Button>
        </form>
    )
}
