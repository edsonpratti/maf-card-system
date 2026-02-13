"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentSchema, type StudentFormData } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { checkCPFExists, submitApplication } from "@/app/actions/solicitar"
import { Loader2 } from "lucide-react"
import { formatCEP, formatPhone } from "@/lib/utils"
import Link from "next/link"

export default function SolicitationForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [cpfStatus, setCpfStatus] = useState<"initial" | "found" | "not_found" | "checking">("initial")
    const [cepLoading, setCepLoading] = useState(false)


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

        setCepLoading(true)
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
            toast.success("Endereço encontrado!")
        } catch (error) {
            toast.error("Erro ao buscar CEP. Preencha os dados manualmente.")
        } finally {
            setCepLoading(false)
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
        <Card className="w-full max-w-2xl mx-auto bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="cpf" className="text-gray-300 text-sm">CPF</Label>
                        <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 text-base"
                            {...cpfRegister}
                            onBlur={(e) => {
                                cpfRegister.onBlur(e)
                                handleCPFBlur(e)
                            }}
                        />
                        {form.formState.errors.cpf && (
                            <p className="text-sm text-red-400">{form.formState.errors.cpf.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-300 text-sm">Nome Completo</Label>
                        <Input
                            id="name"
                            {...form.register("name")}
                            readOnly={cpfStatus === "found"}
                            className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 text-base ${cpfStatus === "found" ? "bg-white/10 text-gray-400" : ""}`}
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-400">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp" className="text-gray-300 text-sm">WhatsApp</Label>
                            <Input
                                id="whatsapp"
                                {...form.register("whatsapp")}
                                placeholder="(00) 00000-0000"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 text-base"
                                onChange={(e) => {
                                    e.target.value = formatPhone(e.target.value)
                                    form.register("whatsapp").onChange(e)
                                }}
                            />
                            {form.formState.errors.whatsapp && (
                                <p className="text-sm text-red-400">{form.formState.errors.whatsapp.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300 text-sm">E-mail</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                {...form.register("email")} 
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 text-base"
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Address Fields Simplified */}
                    <div className="space-y-2">
                        <Label htmlFor="cep" className="text-gray-300 text-sm">CEP</Label>
                        <div className="relative">
                            <Input
                                id="cep"
                                {...form.register("address.cep")}
                                placeholder="00000-000"
                                disabled={cepLoading}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 h-11 text-base"
                                onChange={(e) => {
                                    e.target.value = formatCEP(e.target.value)
                                    form.register("address.cep").onChange(e)
                                }}
                                onBlur={(e) => {
                                    form.register("address.cep").onBlur(e)
                                    handleCEPBlur(e)
                                }}
                            />
                            {cepLoading && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-emerald-400" />
                            )}
                        </div>
                        {cepLoading && (
                            <p className="text-sm text-gray-400">Buscando endereço...</p>
                        )}
                    </div>


                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="street" className="text-gray-300 text-sm">Rua</Label>
                            <Input 
                                id="street" 
                                {...form.register("address.street")} 
                                disabled={cepLoading}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 h-11 text-base"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="number" className="text-gray-300 text-sm">Número</Label>
                                <Input 
                                    id="number" 
                                    {...form.register("address.number")} 
                                    disabled={cepLoading}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 h-11 text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="complement" className="text-gray-300 text-sm">Complemento</Label>
                                <Input 
                                    id="complement" 
                                    {...form.register("address.complement")} 
                                    placeholder="Opcional"
                                    disabled={cepLoading}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 h-11 text-base"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="neighborhood" className="text-gray-300 text-sm">Bairro</Label>
                            <Input 
                                id="neighborhood" 
                                {...form.register("address.neighborhood")} 
                                disabled={cepLoading}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 h-11 text-base"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="city" className="text-gray-300 text-sm">Cidade</Label>
                                <Input 
                                    id="city" 
                                    {...form.register("address.city")} 
                                    disabled={cepLoading}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 h-11 text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state" className="text-gray-300 text-sm">UF</Label>
                                <Input
                                    id="state"
                                    {...form.register("address.state")}
                                    maxLength={2}
                                    disabled={cepLoading}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 h-11 text-base"
                                    onChange={(e) => {
                                        e.target.value = e.target.value.toUpperCase()
                                        form.register("address.state").onChange(e)
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {cpfStatus === "not_found" && (
                        <div className="space-y-2 border border-yellow-500/30 p-3 sm:p-4 rounded-lg bg-yellow-500/10">
                            <Label htmlFor="certificate" className="text-yellow-400 text-sm">Upload do Certificado (Obrigatório)</Label>
                            <Input 
                                id="certificate" 
                                type="file" 
                                accept=".pdf,.jpg,.png" 
                                required 
                                className="bg-white/5 border-white/10 text-white file:bg-emerald-500 file:text-white file:border-0 file:rounded-md file:px-2 sm:file:px-3 file:py-1 file:mr-2 sm:file:mr-3 file:cursor-pointer file:text-xs sm:file:text-sm h-auto py-2"
                            />
                            <p className="text-xs text-yellow-400/80">
                                Como seu CPF não foi encontrado automaticamente, precisamos validar seu certificado manualmente.
                            </p>
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-5 h-12 rounded-full shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 text-base" 
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {cpfStatus === "found" ? "Solicitar Carteirinha Automática" : "Enviar Solicitação para Análise"}
                    </Button>

                    <div className="text-center pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-400">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium transition-colors">
                                Faça login
                            </Link>
                        </p>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
