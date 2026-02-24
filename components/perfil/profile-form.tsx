"use client"

import { useState, useRef, useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Badge } from "@/components/ui/badge"
import {
    User,
    Mail,
    Lock,
    Camera,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Upload,
    Phone,
    CreditCard,
    Calendar,
    Send,
} from "lucide-react"
import {
    updateName,
    updateWhatsApp,
    requestEmailChange,
    requestPasswordChange,
    uploadProfilePhoto,
    removeProfilePhoto,
} from "@/app/actions/perfil"

interface ProfileFormProps {
    user: {
        id: string
        email: string
    }
    profile: {
        name: string
        cpf: string
        whatsapp: string | null
        email: string | null
        card_number: string | null
        status: string | null
        photo_path: string | null
        certification_date: string | null
    }
    photoUrl: string | null
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    AUTO_APROVADA: { label: "Aprovada", variant: "default" },
    APROVADA_MANUAL: { label: "Aprovada", variant: "default" },
    PENDENTE_MANUAL: { label: "Em Análise", variant: "secondary" },
    RECUSADA: { label: "Recusada", variant: "destructive" },
    REVOGADA: { label: "Revogada", variant: "outline" },
}

function formatCPF(cpf: string) {
    const d = cpf.replace(/\D/g, "")
    if (d.length !== 11) return cpf
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

function formatPhone(phone: string) {
    const d = phone.replace(/\D/g, "")
    if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    return phone
}

// ─── Aba: Dados Pessoais ─────────────────────
function DadosPessoaisTab({ profile }: { profile: ProfileFormProps["profile"] }) {
    const [name, setName] = useState(profile.name)
    const [whatsapp, setWhatsapp] = useState(profile.whatsapp || "")
    const [isPending, startTransition] = useTransition()
    const [savingName, setSavingName] = useState(false)
    const [savingWhatsapp, setSavingWhatsapp] = useState(false)

    async function handleSaveName() {
        setSavingName(true)
        startTransition(async () => {
            const result = await updateName(name)
            if (result.success) toast.success(result.message)
            else toast.error(result.message)
            setSavingName(false)
        })
    }

    async function handleSaveWhatsApp() {
        setSavingWhatsapp(true)
        startTransition(async () => {
            const result = await updateWhatsApp(whatsapp)
            if (result.success) toast.success(result.message)
            else toast.error(result.message)
            setSavingWhatsapp(false)
        })
    }

    const status = profile.status ? statusMap[profile.status] : null

    return (
        <div className="space-y-6">
            {/* Info somente leitura */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        Informações do Cartão
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">CPF</Label>
                            <p className="text-sm font-medium mt-1">{formatCPF(profile.cpf)}</p>
                        </div>
                        {profile.card_number && (
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Nº Carteirinha</Label>
                                <p className="text-sm font-medium mt-1">{profile.card_number}</p>
                            </div>
                        )}
                        {profile.certification_date && (
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Data de Habilitação
                                </Label>
                                <p className="text-sm font-medium mt-1">
                                    {new Date(profile.certification_date + "T00:00:00").toLocaleDateString("pt-BR")}
                                </p>
                            </div>
                        )}
                        {status && (
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                                <div className="mt-1">
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Nome */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Nome
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Seu nome completo como exibido no portal e no cartão profissional.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome completo"
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSaveName}
                            disabled={savingName || isPending || name.trim() === profile.name}
                            size="sm"
                        >
                            {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        WhatsApp
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Número de WhatsApp com DDD (apenas números).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                            placeholder="11999999999"
                            maxLength={15}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSaveWhatsApp}
                            disabled={savingWhatsapp || isPending || whatsapp === (profile.whatsapp || "")}
                            size="sm"
                        >
                            {savingWhatsapp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                        </Button>
                    </div>
                    {whatsapp && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Formatado: {formatPhone(whatsapp)}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Aba: Email ──────────────────────────────
function EmailTab({ user, profile }: { user: ProfileFormProps["user"]; profile: ProfileFormProps["profile"] }) {
    const [newEmail, setNewEmail] = useState("")
    const [isPending, startTransition] = useTransition()
    const [sent, setSent] = useState(false)

    async function handleRequestChange() {
        startTransition(async () => {
            const result = await requestEmailChange(newEmail)
            if (result.success) {
                toast.success(result.message)
                setSent(true)
                setNewEmail("")
            } else {
                toast.error(result.message)
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Email atual */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email atual
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm font-medium bg-muted px-3 py-2 rounded-md">{user.email}</p>
                </CardContent>
            </Card>

            {/* Trocar email */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Alterar email</CardTitle>
                    <CardDescription className="text-xs">
                        Um link de confirmação será enviado ao <strong>novo endereço</strong>. O email só será alterado após a confirmação.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sent ? (
                        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Email enviado!</p>
                                <p className="text-xs mt-1 text-emerald-600">
                                    Verifique a caixa de entrada do novo email e clique no link de confirmação.
                                </p>
                                <Button
                                    variant="link"
                                    className="h-auto p-0 text-xs text-emerald-700 mt-2"
                                    onClick={() => setSent(false)}
                                >
                                    Enviar para outro email
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1.5">
                                <Label htmlFor="new-email">Novo email</Label>
                                <Input
                                    id="new-email"
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="novo@exemplo.com"
                                />
                            </div>
                            <Button
                                onClick={handleRequestChange}
                                disabled={isPending || !newEmail.trim()}
                                className="w-full sm:w-auto"
                            >
                                {isPending ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</>
                                ) : (
                                    <><Send className="h-4 w-4 mr-2" /> Enviar link de confirmação</>
                                )}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Aba: Senha ──────────────────────────────
function SenhaTab() {
    const [isPending, startTransition] = useTransition()
    const [sent, setSent] = useState(false)

    async function handleRequest() {
        startTransition(async () => {
            const result = await requestPasswordChange()
            if (result.success) {
                toast.success("Email enviado! Verifique sua caixa de entrada.")
                setSent(true)
            } else {
                toast.error(result.message)
            }
        })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Alterar senha
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Enviaremos um link seguro para seu email atual. Clique no link para definir uma nova senha.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sent ? (
                        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Email enviado!</p>
                                <p className="text-xs mt-1 text-emerald-600">
                                    Verifique sua caixa de entrada e siga as instruções para definir sua nova senha.
                                    O link expira em 30 minutos.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <p className="text-xs">
                                    Por segurança, a troca de senha é feita via email. Você receberá um link para definir sua nova senha.
                                </p>
                            </div>
                            <Button onClick={handleRequest} disabled={isPending} className="w-full sm:w-auto">
                                {isPending ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</>
                                ) : (
                                    <><Send className="h-4 w-4 mr-2" /> Enviar link de redefinição</>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Aba: Foto ───────────────────────────────
function FotoTab({ profile, photoUrl }: { profile: ProfileFormProps["profile"]; photoUrl: string | null }) {
    const [preview, setPreview] = useState<string | null>(photoUrl)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isRemoving, setIsRemoving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!allowed.includes(file.type)) {
            toast.error("Formato inválido. Use JPEG, PNG ou WebP.")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Arquivo muito grande. Máximo: 5MB.")
            return
        }

        setSelectedFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    async function handleUpload() {
        if (!selectedFile) return
        const formData = new FormData()
        formData.append("photo", selectedFile)

        startTransition(async () => {
            const result = await uploadProfilePhoto(formData)
            if (result.success) {
                toast.success(result.message)
                if (result.photoUrl) setPreview(result.photoUrl + "?t=" + Date.now())
                setSelectedFile(null)
            } else {
                toast.error(result.message)
                // Revert preview
                setPreview(photoUrl)
                setSelectedFile(null)
            }
        })
    }

    async function handleRemove() {
        setIsRemoving(true)
        startTransition(async () => {
            const result = await removeProfilePhoto()
            if (result.success) {
                toast.success(result.message)
                setPreview(null)
                setSelectedFile(null)
            } else {
                toast.error(result.message)
            }
            setIsRemoving(false)
        })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        Foto de perfil
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Formatos aceitos: JPEG, PNG, WebP. Tamanho máximo: 5MB.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Preview */}
                        <div className="relative shrink-0">
                            {preview ? (
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-border shadow-md relative">
                                    <Image
                                        src={preview}
                                        alt="Foto de perfil"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="w-28 h-28 rounded-full border-4 border-dashed border-border bg-muted flex items-center justify-center">
                                    <User className="h-10 w-10 text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col gap-3 w-full sm:w-auto">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isPending}
                                className="w-full sm:w-auto"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {preview ? "Trocar foto" : "Selecionar foto"}
                            </Button>

                            {selectedFile && (
                                <Button
                                    onClick={handleUpload}
                                    disabled={isPending}
                                    className="w-full sm:w-auto"
                                >
                                    {isPending ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</>
                                    ) : (
                                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar upload</>
                                    )}
                                </Button>
                            )}

                            {preview && !selectedFile && (
                                <Button
                                    variant="outline"
                                    onClick={handleRemove}
                                    disabled={isPending || isRemoving}
                                    className="w-full sm:w-auto text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                                >
                                    {isRemoving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Remover foto
                                </Button>
                            )}

                            {selectedFile && (
                                <p className="text-xs text-muted-foreground">
                                    Arquivo selecionado: {selectedFile.name}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Componente principal ────────────────────
export function ProfileForm({ user, profile, photoUrl }: ProfileFormProps) {
    return (
        <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-6">
                <TabsTrigger value="dados" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <User className="h-3.5 w-3.5 hidden sm:block" />
                    <span>Dados</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Mail className="h-3.5 w-3.5 hidden sm:block" />
                    <span>Email</span>
                </TabsTrigger>
                <TabsTrigger value="senha" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Lock className="h-3.5 w-3.5 hidden sm:block" />
                    <span>Senha</span>
                </TabsTrigger>
                <TabsTrigger value="foto" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Camera className="h-3.5 w-3.5 hidden sm:block" />
                    <span>Foto</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="dados">
                <DadosPessoaisTab profile={profile} />
            </TabsContent>

            <TabsContent value="email">
                <EmailTab user={user} profile={profile} />
            </TabsContent>

            <TabsContent value="senha">
                <SenhaTab />
            </TabsContent>

            <TabsContent value="foto">
                <FotoTab profile={profile} photoUrl={photoUrl} />
            </TabsContent>
        </Tabs>
    )
}
