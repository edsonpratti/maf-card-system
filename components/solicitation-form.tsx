"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentSchema, type StudentFormData } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { checkCPFExists, submitApplication } from "@/app/actions/solicitar"
import { Loader2 } from "lucide-react"
import { formatCEP, formatPhone } from "@/lib/utils"

export default function SolicitationForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [cpfStatus, setCpfStatus] = useState<"initial" | "found" | "not_found" | "checking">("initial")


    const form = useForm<StudentFormData>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            cpf: "",
            name: "",
            whatsapp: "",
            email: "",
            address: {
                cep: "",
                street: "",
                number: "",
                complement: "",
                neighborhood: "",
                city: "",
                state: "",
            },
        },
    })

    // Update handleCPFBlur to validate first
    const handleCPFBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const isValid = await form.trigger("cpf")
        if (!isValid) {
            setCpfStatus("initial")
            return
        }

        const cpf = e.target.value
        setCpfStatus("checking")
        try {
            const result = await checkCPFExists(cpf)
            if (result.alreadyApplied) {
                toast.error(result.message)
                setCpfStatus("initial")
                return
            }

            if (result.exists && result.name) {

                form.setValue("name", result.name)
                setCpfStatus("found")
                toast.success(result.message)
            } else {
                setCpfStatus("not_found")
                toast.info(result.message)
            }
        } catch (error) {
            toast.error("Erro ao verificar CPF")
            setCpfStatus("initial")
        }
    }

    const cpfRegister = form.register("cpf")

    const handleCEPBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, "")
        if (cep.length !== 8) return

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            const data = await response.json()

            if (data.erro) {
                toast.error("CEP não encontrado")
                return
            }

            form.setValue("address.street", data.logradouro)
            form.setValue("address.neighborhood", data.bairro)
            form.setValue("address.city", data.localidade)
            form.setValue("address.state", data.uf)
            // Focus on number field automatically for better UX
            form.setFocus("address.number")
        } catch (error) {
            // Silently fail CEP lookup
        }
    }



    const onSubmit = async (data: StudentFormData) => {
        setLoading(true)
        const formData = new FormData()
        formData.append("cpf", data.cpf)
        formData.append("name", data.name)
        formData.append("whatsapp", data.whatsapp)
        formData.append("email", data.email)
        formData.append("address.cep", data.address.cep)
        formData.append("address.street", data.address.street)
        formData.append("address.number", data.address.number)
        formData.append("address.complement", data.address.complement || "")
        formData.append("address.neighborhood", data.address.neighborhood)
        formData.append("address.city", data.address.city)
        formData.append("address.state", data.address.state)

        // Handle file upload if needed (manual via input ref or controlled input)
        // For simplicity, assuming file input exists and we grab it from DOM or state if not using controlled
        const fileInput = document.getElementById("certificate") as HTMLInputElement
        if (cpfStatus === "not_found") {
            const file = fileInput?.files?.[0]
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    toast.error("O arquivo deve ter no máximo 5MB.")
                    setLoading(false)
                    return
                }
                formData.append("certificate", file)
            } else {
                // Should be caught by 'required' attribute on input, but safe to check
                toast.error("Por favor, faça o upload do certificado.")
                setLoading(false)
                return
            }
        }

        try {
            const result = await submitApplication(null, formData)
            if (result.success) {
                toast.success(result.message)
                // Redirect to confirmation page with status
                router.push(`/solicitar/confirmacao?status=${result.status}`)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Erro ao enviar solicitação")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Solicitação de Carteira Profissional</CardTitle>
                <CardDescription>Preencha os dados abaixo para solicitar sua carteira profissional.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            {...cpfRegister}
                            onBlur={(e) => {
                                cpfRegister.onBlur(e)
                                handleCPFBlur(e)
                            }}
                        />
                        {form.formState.errors.cpf && (
                            <p className="text-sm text-red-500">{form.formState.errors.cpf.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                            id="name"
                            {...form.register("name")}
                            readOnly={cpfStatus === "found"}
                            className={cpfStatus === "found" ? "bg-muted" : ""}
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input
                                id="whatsapp"
                                {...form.register("whatsapp")}
                                placeholder="(00) 00000-0000"
                                onChange={(e) => {
                                    e.target.value = formatPhone(e.target.value)
                                    form.register("whatsapp").onChange(e)
                                }}
                            />
                            {form.formState.errors.whatsapp && (
                                <p className="text-sm text-red-500">{form.formState.errors.whatsapp.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" type="email" {...form.register("email")} />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Address Fields Simplified */}
                    <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                            id="cep"
                            {...form.register("address.cep")}
                            placeholder="00000-000"
                            onChange={(e) => {
                                e.target.value = formatCEP(e.target.value)
                                form.register("address.cep").onChange(e)
                            }}
                            onBlur={(e) => {
                                form.register("address.cep").onBlur(e)
                                handleCEPBlur(e)
                            }}
                        />
                    </div>


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="street">Rua</Label>
                            <Input id="street" {...form.register("address.street")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="number">Número</Label>
                            <Input id="number" {...form.register("address.number")} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="neighborhood">Bairro</Label>
                            <Input id="neighborhood" {...form.register("address.neighborhood")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">Cidade</Label>
                            <Input id="city" {...form.register("address.city")} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state">Estado (UF)</Label>
                        <Input
                            id="state"
                            {...form.register("address.state")}
                            maxLength={2}
                            onChange={(e) => {
                                e.target.value = e.target.value.toUpperCase()
                                form.register("address.state").onChange(e)
                            }}
                        />
                    </div>

                    {cpfStatus === "not_found" && (
                        <div className="space-y-2 border p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                            <Label htmlFor="certificate">Upload do Certificado (Obrigatório)</Label>
                            <Input id="certificate" type="file" accept=".pdf,.jpg,.png" required />
                            <p className="text-xs text-muted-foreground">
                                Como seu CPF não foi encontrado automaticamente, precisamos validar seu certificado manualmente.
                            </p>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {cpfStatus === "found" ? "Solicitar Carteirinha Automática" : "Enviar Solicitação para Análise"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
