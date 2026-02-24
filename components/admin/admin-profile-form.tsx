"use client"

import { useState, useTransition } from "react"
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
    Lock,
    Loader2,
    ShieldCheck,
    CheckCircle2,
    Mail,
    Calendar,
    Save,
} from "lucide-react"
import { updateAdminName, updateAdminPassword } from "@/app/actions/admin-perfil"
import { ADMIN_MODULES, ROLE_LABELS } from "@/lib/admin-permissions"
import type { AdminRole, AdminPermission } from "@/lib/admin-permissions"

interface AdminProfileFormProps {
    profile: {
        id: string
        email: string
        name: string
        role: AdminRole
        permissions: AdminPermission[]
        createdAt: string
    }
}

// ─── Aba: Conta ──────────────────────────────
function ContaTab({ profile }: AdminProfileFormProps) {
    const [name, setName] = useState(profile.name)
    const [isPending, startTransition] = useTransition()
    const [savingName, setSavingName] = useState(false)

    async function handleSaveName() {
        setSavingName(true)
        startTransition(async () => {
            const result = await updateAdminName(name)
            if (result.success) toast.success(result.message)
            else toast.error(result.message)
            setSavingName(false)
        })
    }

    const isMaster = profile.role === "master"

    // Permissões habilitadas para este admin
    const grantedModules = ADMIN_MODULES.filter((m) =>
        isMaster || profile.permissions.includes(m.key)
    )

    return (
        <div className="space-y-6">
            {/* Informações da conta */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Informações da Conta
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <p className="text-sm font-medium truncate">{profile.email}</p>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Papel</Label>
                            <div className="mt-1">
                                <Badge variant={isMaster ? "default" : "secondary"}>
                                    {ROLE_LABELS[profile.role]}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Membro desde
                            </Label>
                            <p className="text-sm font-medium mt-1">
                                {new Date(profile.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Para alterar o email da conta admin, contate um administrador master.
                    </p>
                </CardContent>
            </Card>

            {/* Nome */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Nome de exibição</CardTitle>
                    <CardDescription className="text-xs">
                        Nome exibido no painel administrativo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome"
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSaveName}
                            disabled={savingName || isPending || name.trim() === profile.name}
                            size="sm"
                        >
                            {savingName ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Módulos / Permissões */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        Acesso aos Módulos
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {isMaster
                            ? "Como administrador master, você tem acesso irrestrito a todos os módulos."
                            : "Módulos liberados para o seu acesso pelo master."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {ADMIN_MODULES.map((mod) => {
                            const hasAccess = isMaster || profile.permissions.includes(mod.key)
                            return (
                                <div
                                    key={mod.key}
                                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                                        hasAccess
                                            ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                                            : "border-border bg-muted/30 opacity-50"
                                    }`}
                                >
                                    <CheckCircle2
                                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                                            hasAccess ? "text-emerald-500" : "text-muted-foreground"
                                        }`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{mod.label}</p>
                                        <p className="text-xs text-muted-foreground">{mod.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Aba: Senha ──────────────────────────────
function SenhaTab() {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isPending, startTransition] = useTransition()

    function resetForm() {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (newPassword.length < 8) {
            toast.error("Nova senha deve ter ao menos 8 caracteres.")
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error("As senhas não coincidem.")
            return
        }
        if (newPassword === currentPassword) {
            toast.error("A nova senha deve ser diferente da atual.")
            return
        }

        startTransition(async () => {
            const result = await updateAdminPassword(currentPassword, newPassword)
            if (result.success) {
                toast.success(result.message)
                resetForm()
            } else {
                toast.error(result.message)
            }
        })
    }

    const isFormValid =
        currentPassword.length > 0 &&
        newPassword.length >= 8 &&
        confirmPassword.length > 0 &&
        newPassword === confirmPassword &&
        newPassword !== currentPassword

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Alterar senha
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Confirme sua senha atual antes de definir uma nova.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="current-password">Senha atual</Label>
                            <PasswordInput
                                id="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="new-password">Nova senha</Label>
                            <PasswordInput
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                autoComplete="new-password"
                            />
                            {newPassword.length > 0 && newPassword.length < 8 && (
                                <p className="text-xs text-destructive">Mínimo de 8 caracteres.</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                            <PasswordInput
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita a nova senha"
                                autoComplete="new-password"
                            />
                            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                                <p className="text-xs text-destructive">As senhas não coincidem.</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={!isFormValid || isPending}
                            className="w-full sm:w-auto"
                        >
                            {isPending ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Atualizando…</>
                            ) : (
                                <><Lock className="h-4 w-4 mr-2" />Alterar senha</>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Componente principal ────────────────────
export function AdminProfileForm({ profile }: AdminProfileFormProps) {
    return (
        <Tabs defaultValue="conta" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="conta" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Conta
                </TabsTrigger>
                <TabsTrigger value="senha" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Senha
                </TabsTrigger>
            </TabsList>

            <TabsContent value="conta">
                <ContaTab profile={profile} />
            </TabsContent>

            <TabsContent value="senha">
                <SenhaTab />
            </TabsContent>
        </Tabs>
    )
}
