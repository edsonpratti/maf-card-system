"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
    Settings, 
    Shield, 
    CheckCircle, 
    AlertTriangle,
    Save,
    RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { getValidationSettings, updateValidationSettings } from "@/app/actions/admin"

type ValidationSettings = {
    auto_validation_enabled: boolean
    require_certificate_upload: boolean
    auto_send_first_access_email: boolean
    rejection_email_enabled: boolean
    default_rejection_message: string
}

export default function ConfiguracoesPage() {
    const [settings, setSettings] = useState<ValidationSettings>({
        auto_validation_enabled: true,
        require_certificate_upload: true,
        auto_send_first_access_email: true,
        rejection_email_enabled: true,
        default_rejection_message: "Seu certificado não pôde ser validado. Por favor, entre em contato para mais informações."
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    async function loadSettings() {
        setLoading(true)
        try {
            const data = await getValidationSettings()
            if (data) {
                setSettings(data)
            }
        } catch (error) {
            toast.error("Erro ao carregar configurações")
        }
        setLoading(false)
    }

    useEffect(() => {
        loadSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const result = await updateValidationSettings(settings)
            if (result.success) {
                toast.success("Configurações salvas com sucesso!")
            } else {
                toast.error(result.message || "Erro ao salvar configurações")
            }
        } catch (error) {
            toast.error("Erro ao salvar configurações")
        }
        setSaving(false)
    }

    const updateSetting = <K extends keyof ValidationSettings>(
        key: K, 
        value: ValidationSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure o comportamento do módulo MAF Pro ID
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} variant="success">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
            </div>

            {/* Validação Automática */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Validação Automática
                    </CardTitle>
                    <CardDescription>
                        Configure como o sistema valida automaticamente os certificados
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="auto-validation" className="font-medium">
                                Validação Automática Habilitada
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Quando ativado, CPFs que constam na base de alunas são aprovados automaticamente
                            </p>
                        </div>
                        <Switch
                            id="auto-validation"
                            checked={settings.auto_validation_enabled}
                            onCheckedChange={(checked: boolean) => updateSetting("auto_validation_enabled", checked)}
                        />
                    </div>

                    <div className="border-t pt-6 flex items-center justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="require-certificate" className="font-medium">
                                Exigir Upload de Certificado
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Quando desativado, alunas na base podem solicitar sem enviar certificado
                            </p>
                        </div>
                        <Switch
                            id="require-certificate"
                            checked={settings.require_certificate_upload}
                            onCheckedChange={(checked: boolean) => updateSetting("require_certificate_upload", checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notificações por Email */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Notificações por Email
                    </CardTitle>
                    <CardDescription>
                        Configure os emails automáticos enviados pelo sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="first-access-email" className="font-medium">
                                Email de Primeiro Acesso Automático
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Enviar automaticamente email de primeiro acesso quando aprovado
                            </p>
                        </div>
                        <Switch
                            id="first-access-email"
                            checked={settings.auto_send_first_access_email}
                            onCheckedChange={(checked: boolean) => updateSetting("auto_send_first_access_email", checked)}
                        />
                    </div>

                    <div className="border-t pt-6 flex items-center justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="rejection-email" className="font-medium">
                                Email de Recusa Habilitado
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Enviar email quando um certificado for recusado
                            </p>
                        </div>
                        <Switch
                            id="rejection-email"
                            checked={settings.rejection_email_enabled}
                            onCheckedChange={(checked: boolean) => updateSetting("rejection_email_enabled", checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Mensagens Padrão */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Mensagens Padrão
                    </CardTitle>
                    <CardDescription>
                        Configure mensagens padrão usadas pelo sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rejection-message" className="font-medium">
                            Mensagem Padrão de Recusa
                        </Label>
                        <Textarea
                            id="rejection-message"
                            placeholder="Digite a mensagem padrão de recusa..."
                            value={settings.default_rejection_message}
                            onChange={(e) => updateSetting("default_rejection_message", e.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            Esta mensagem será usada como sugestão ao recusar um certificado
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Informações do Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium">Versão do Módulo</p>
                            <p className="text-2xl font-bold">1.0.0</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium">Ambiente</p>
                            <p className="text-2xl font-bold">
                                {process.env.NODE_ENV === "production" ? "Produção" : "Desenvolvimento"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
