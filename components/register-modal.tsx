"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentSchema, type StudentFormData } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { checkCPFExists, submitApplication } from "@/app/actions/solicitar"
import { Loader2, User, Phone, Mail, MapPin, FileText, CheckCircle2, AlertCircle, Upload } from "lucide-react"
import { formatCEP, formatPhone } from "@/lib/utils"

interface RegisterModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function RegisterModal({ open, onOpenChange }: RegisterModalProps) {
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

        const fileInput = document.getElementById("certificate-modal") as HTMLInputElement
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
                toast.error("Por favor, faça o upload do certificado.")
                setLoading(false)
                return
            }
        }

        try {
            const result = await submitApplication(null, formData)
            if (result.success) {
                toast.success(result.message)
                onOpenChange(false)
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden p-0">
                <div className="overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <User className="h-6 w-6 text-primary" />
                            Cadastro no MAF Pro
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Preencha seus dados para criar sua conta e solicitar sua carteira profissional.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
                        {/* Seção de Identificação */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <User className="h-4 w-4" />
                                Dados Pessoais
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="cpf-modal" className="flex items-center gap-2">
                                    CPF
                                    {cpfStatus === "found" && (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    )}
                                    {cpfStatus === "checking" && (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    )}
                                </Label>
                                <Input
                                    id="cpf-modal"
                                    placeholder="000.000.000-00"
                                    {...cpfRegister}
                                    onBlur={(e) => {
                                        cpfRegister.onBlur(e)
                                        handleCPFBlur(e)
                                    }}
                                    className={cpfStatus === "found" ? "border-green-500" : ""}
                                />
                                {form.formState.errors.cpf && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {form.formState.errors.cpf.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name-modal">Nome Completo</Label>
                                <Input
                                    id="name-modal"
                                    {...form.register("name")}
                                    readOnly={cpfStatus === "found"}
                                    className={cpfStatus === "found" ? "bg-muted border-green-500" : ""}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {form.formState.errors.name.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Seção de Contato */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <Phone className="h-4 w-4" />
                                Contato
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp-modal" className="flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5" />
                                        WhatsApp
                                    </Label>
                                    <Input
                                        id="whatsapp-modal"
                                        {...form.register("whatsapp")}
                                        placeholder="(00) 00000-0000"
                                        onChange={(e) => {
                                            e.target.value = formatPhone(e.target.value)
                                            form.register("whatsapp").onChange(e)
                                        }}
                                    />
                                    {form.formState.errors.whatsapp && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {form.formState.errors.whatsapp.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email-modal" className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />
                                        E-mail
                                    </Label>
                                    <Input id="email-modal" type="email" {...form.register("email")} />
                                    {form.formState.errors.email && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {form.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Seção de Endereço */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <MapPin className="h-4 w-4" />
                                Endereço
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="cep-modal">CEP</Label>
                                <Input
                                    id="cep-modal"
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
                                {form.formState.errors.address?.cep && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {form.formState.errors.address.cep.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="street-modal">Rua</Label>
                                    <Input id="street-modal" {...form.register("address.street")} />
                                    {form.formState.errors.address?.street && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {form.formState.errors.address.street.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="number-modal">Número</Label>
                                    <Input id="number-modal" {...form.register("address.number")} />
                                    {form.formState.errors.address?.number && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {form.formState.errors.address.number.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="complement-modal">Complemento (Opcional)</Label>
                                    <Input id="complement-modal" {...form.register("address.complement")} placeholder="Apto, Bloco, etc." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="neighborhood-modal">Bairro</Label>
                                    <Input id="neighborhood-modal" {...form.register("address.neighborhood")} />
                                    {form.formState.errors.address?.neighborhood && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {form.formState.errors.address.neighborhood.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="city-modal">Cidade</Label>
                                    <Input id="city-modal" {...form.register("address.city")} />
                                    {form.formState.errors.address?.city && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {form.formState.errors.address.city.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state-modal">Estado (UF)</Label>
                                    <Input
                                        id="state-modal"
                                        {...form.register("address.state")}
                                        maxLength={2}
                                        placeholder="SP"
                                        onChange={(e) => {
                                            e.target.value = e.target.value.toUpperCase()
                                            form.register("address.state").onChange(e)
                                        }}
                                    />
                                    {form.formState.errors.address?.state && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {form.formState.errors.address.state.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Seção de Upload do Certificado */}
                        {cpfStatus === "not_found" && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    <FileText className="h-4 w-4" />
                                    Documentação
                                </div>
                                
                                <div className="space-y-3 border-2 border-dashed border-primary/30 rounded-lg p-6 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10">
                                    <div className="flex items-start gap-3">
                                        <Upload className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor="certificate-modal" className="text-base font-medium cursor-pointer">
                                                Upload do Certificado (Obrigatório)
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Como seu CPF não foi encontrado automaticamente, precisamos validar seu certificado manualmente.
                                            </p>
                                        </div>
                                    </div>
                                    <Input 
                                        id="certificate-modal" 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png" 
                                        required 
                                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                    />
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Formatos aceitos: PDF, JPG, PNG (máx. 5MB)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Botão de Submissão */}
                        <div className="pt-4 border-t">
                            <Button 
                                type="submit" 
                                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        {cpfStatus === "found" ? (
                                            <>
                                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                                Criar Conta e Solicitar Carteirinha
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="mr-2 h-5 w-5" />
                                                Criar Conta e Enviar para Análise
                                            </>
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
