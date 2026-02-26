"use client"

import { useState } from "react"
import {
    getAdminUsers,
    createAdminUser,
    resetAdminPassword,
    updateAdminPermissions,
    updateAdminRole,
    deleteAdminUser,
} from "@/app/actions/admin-users"
import { ADMIN_MODULES } from "@/lib/admin-permissions"
import type { AdminRole, AdminPermission } from "@/lib/admin-permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { KeyRound, Loader2, Shield, UserCog, Trash2, Pencil, UserPlus, Crown, Info, ShieldCheck } from "lucide-react"

type AdminUser = {
    id: string
    name: string
    email: string
    role: AdminRole
    permissions: AdminPermission[]
    created_by_email?: string | null
    created_at: string
    source?: string
}

interface AdminUsersClientProps {
    initialAdmins: AdminUser[]
    myRole: AdminRole
}

const ROLE_CONFIG = {
    super_admin: {
        label: "Super Admin",
        description: "Controle total, incluindo gestão de outros administradores",
        variant: "destructive" as const,
        icon: ShieldCheck,
    },
    master: {
        label: "Master",
        description: "Acesso irrestrito a todos os módulos",
        variant: "default" as const,
        icon: Crown,
    },
    operator: {
        label: "Operador",
        description: "Acesso limitado aos módulos liberados pelo master",
        variant: "secondary" as const,
        icon: UserCog,
    },
}

export function AdminUsersClient({ initialAdmins, myRole }: AdminUsersClientProps) {
    const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins)
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "operator" as AdminRole,
        permissions: [] as AdminPermission[],
    })
    const [loading, setLoading] = useState(false)
    const [resetLoadingEmail, setResetLoadingEmail] = useState<string | null>(null)
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)

    // Edit permissions dialog
    const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
    const [editPermissions, setEditPermissions] = useState<AdminPermission[]>([])
    const [editLoading, setEditLoading] = useState(false)

    // Edit role dialog (super_admin only)
    const [roleEditTarget, setRoleEditTarget] = useState<AdminUser | null>(null)
    const [newRole, setNewRole] = useState<AdminRole>("operator")
    const [newPermissions, setNewPermissions] = useState<AdminPermission[]>([])
    const [roleEditLoading, setRoleEditLoading] = useState(false)

    const refreshAdmins = async () => {
        const updated = await getAdminUsers()
        setAdmins(updated as AdminUser[])
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.id]: e.target.value })
    }

    const togglePermission = (key: AdminPermission, current: AdminPermission[], setter: (p: AdminPermission[]) => void) => {
        if (current.includes(key)) {
            setter(current.filter((p) => p !== key))
        } else {
            setter([...current, key])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const res = await createAdminUser(
            form.name,
            form.email,
            form.password,
            form.role,
            form.permissions
        )
        if (res.success) {
            toast.success(res.message)
            setForm({ name: "", email: "", password: "", role: "operator", permissions: [] })
            await refreshAdmins()
        } else {
            toast.error(res.message)
        }
        setLoading(false)
    }

    const handleResetPassword = async (email: string) => {
        setResetLoadingEmail(email)
        const res = await resetAdminPassword(email)
        if (res.success) {
            toast.success(res.message)
        } else {
            toast.error(res.message)
        }
        setResetLoadingEmail(null)
    }

    const handleDelete = async (adminId: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover o operador "${name}"? Esta ação revogará o acesso ao painel.`)) return
        setDeleteLoadingId(adminId)
        const res = await deleteAdminUser(adminId)
        if (res.success) {
            toast.success(res.message)
            await refreshAdmins()
        } else {
            toast.error(res.message)
        }
        setDeleteLoadingId(null)
    }

    const openEditPermissions = (admin: AdminUser) => {
        setEditTarget(admin)
        setEditPermissions([...(admin.permissions ?? [])])
    }

    const handleSavePermissions = async () => {
        if (!editTarget) return
        setEditLoading(true)
        const res = await updateAdminPermissions(editTarget.id, editPermissions)
        if (res.success) {
            toast.success(res.message)
            await refreshAdmins()
            setEditTarget(null)
        } else {
            toast.error(res.message)
        }
        setEditLoading(false)
    }

    const openRoleEdit = (admin: AdminUser) => {
        setRoleEditTarget(admin)
        setNewRole(admin.role)
        setNewPermissions([...(admin.permissions ?? [])])
    }

    const handleSaveRole = async () => {
        if (!roleEditTarget) return
        setRoleEditLoading(true)
        const res = await updateAdminRole(roleEditTarget.id, newRole, newPermissions)
        if (res.success) {
            toast.success(res.message)
            await refreshAdmins()
            setRoleEditTarget(null)
        } else {
            toast.error(res.message)
        }
        setRoleEditLoading(false)
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Usuários Admin</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie os administradores do sistema e suas permissões de acesso.
                </p>
            </div>

            {/* Info sobre papéis */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myRole === "super_admin" && (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-destructive" />
                                Super Admin
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Controle total sobre todos os administradores. Pode editar, excluir e alterar o papel de masters e operadores.
                            </p>
                        </CardContent>
                    </Card>
                )}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Crown className="h-4 w-4 text-primary" />
                            Admin Master
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Acesso irrestrito a todos os módulos do painel. Pode cadastrar operadores e gerenciar permissões.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-secondary/40 bg-secondary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            Admin Operador
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Acesso limitado. Só visualiza e usa os módulos explicitamente liberados por um master.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Cadastrar novo admin */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Cadastrar Novo Administrador
                    </CardTitle>
                    <CardDescription>
                        Apenas administradores master podem cadastrar novos usuários admin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome completo</Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Nome completo"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="email@exemplo.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Senha inicial</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Papel</Label>
                                <Select
                                    value={form.role}
                                    onValueChange={(v) =>
                                        setForm({ ...form, role: v as AdminRole, permissions: [] })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myRole === "super_admin" && (
                                            <SelectItem value="super_admin">
                                                <span className="flex items-center gap-2">
                                                    <ShieldCheck className="h-3.5 w-3.5" />
                                                    Super Admin — controle total
                                                </span>
                                            </SelectItem>
                                        )}
                                        <SelectItem value="master">
                                            <span className="flex items-center gap-2">
                                                <Crown className="h-3.5 w-3.5" />
                                                Master — acesso irrestrito
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="operator">
                                            <span className="flex items-center gap-2">
                                                <UserCog className="h-3.5 w-3.5" />
                                                Operador — acesso limitado
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Permissões — só aparece se for operador */}
                        {form.role === "operator" && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-semibold">Módulos liberados para este operador</Label>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {ADMIN_MODULES.map((module) => (
                                        <label
                                            key={module.key}
                                            className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                        >
                                            <Checkbox
                                                checked={form.permissions.includes(module.key as AdminPermission)}
                                                onCheckedChange={() =>
                                                    togglePermission(
                                                        module.key as AdminPermission,
                                                        form.permissions,
                                                        (p) => setForm({ ...form, permissions: p })
                                                    )
                                                }
                                                className="mt-0.5"
                                            />
                                            <div>
                                                <p className="text-sm font-medium">{module.label}</p>
                                                <p className="text-xs text-muted-foreground">{module.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {form.permissions.length === 0 && (
                                    <div className="flex items-center gap-2 text-amber-600 text-xs">
                                        <Info className="h-3.5 w-3.5" />
                                        <span>Nenhum módulo selecionado — o operador não terá acesso a nada além do Início.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <UserPlus className="h-4 w-4" />
                            )}
                            {loading ? "Cadastrando..." : form.role === "super_admin" ? "Cadastrar Super Admin" : form.role === "master" ? "Cadastrar Master" : "Cadastrar Operador"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Lista de admins */}
            <Card>
                <CardHeader>
                    <CardTitle>Administradores Cadastrados</CardTitle>
                    <CardDescription>{admins.length} administrador{admins.length !== 1 ? "es" : ""} no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Nenhum administrador cadastrado.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {admins.map((admin, index) => {
                                const config = ROLE_CONFIG[admin.role ?? "master"]
                                const RoleIcon = config.icon
                                const isSuperAdmin = admin.role === "super_admin"
                                const isMasterUser = admin.role === "master" || admin.role === undefined

                                // Quem pode editar permissões: super_admin pode editar qualquer um (exceto super_admins); master só pode editar operadores
                                const canEditPermissions = !admin.source && !isSuperAdmin && (
                                    myRole === "super_admin" || admin.role === "operator"
                                )
                                // Quem pode alterar papel: somente super_admin, e não em si mesmo (super_admin)
                                const canEditRole = myRole === "super_admin" && !isSuperAdmin && !admin.source
                                // Quem pode excluir: super_admin pode excluir masters e operadores; master só pode excluir operadores
                                const canDelete = !admin.source && !isSuperAdmin && (
                                    myRole === "super_admin" || admin.role === "operator"
                                )

                                return (
                                    <div key={admin.id}>
                                        {index > 0 && <div className="border-t mb-3" />}
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={`p-2 rounded-lg shrink-0 ${isMasterUser ? "bg-primary/10" : "bg-secondary/30"}`}>
                                                    <RoleIcon className={`h-4 w-4 ${isMasterUser ? "text-primary" : "text-secondary-foreground"}`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm">{admin.name}</span>
                                                        <Badge variant={config.variant} className="text-xs">
                                                            {config.label}
                                                        </Badge>
                                                        {admin.source === "auth" && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Sistema
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{admin.email}</p>
                                                    {admin.created_by_email && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Cadastrado por: {admin.created_by_email}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        Cadastrado em:{" "}
                                                        {new Date(admin.created_at).toLocaleString("pt-BR", {
                                                            timeZone: "America/Sao_Paulo",
                                                        })}
                                                    </p>

                                                    {/* Permissões do operador */}
                                                    {!isMasterUser && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {(admin.permissions ?? []).length === 0 ? (
                                                                <span className="text-xs text-amber-600">Sem módulos liberados</span>
                                                            ) : (
                                                                (admin.permissions ?? []).map((perm) => {
                                                                    const mod = ADMIN_MODULES.find((m) => m.key === perm)
                                                                    return mod ? (
                                                                        <Badge
                                                                            key={perm}
                                                                            variant="outline"
                                                                            className="text-xs bg-green-50 text-green-700 border-green-200"
                                                                        >
                                                                            {mod.label}
                                                                        </Badge>
                                                                    ) : null
                                                                })
                                                            )}
                                                        </div>
                                                    )}

                                                    {isMasterUser && !isSuperAdmin && (
                                                        <p className="text-xs text-primary mt-1">Acesso irrestrito a todos os módulos</p>
                                                    )}
                                                    {isSuperAdmin && (
                                                        <p className="text-xs text-destructive mt-1">Controle total sobre todos os administradores</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Ações */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {canEditPermissions && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1.5 text-xs"
                                                        onClick={() => openEditPermissions(admin)}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                        Permissões
                                                    </Button>
                                                )}
                                                {canEditRole && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1.5 text-xs"
                                                        onClick={() => openRoleEdit(admin)}
                                                    >
                                                        <ShieldCheck className="h-3 w-3" />
                                                        Papel
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1.5 text-xs"
                                                    disabled={resetLoadingEmail === admin.email}
                                                    onClick={() => handleResetPassword(admin.email)}
                                                >
                                                    {resetLoadingEmail === admin.email ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <KeyRound className="h-3 w-3" />
                                                    )}
                                                    Resetar Senha
                                                </Button>
                                                {canDelete && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1.5 text-xs text-destructive hover:text-destructive"
                                                        disabled={deleteLoadingId === admin.id}
                                                        onClick={() => handleDelete(admin.id, admin.name)}
                                                    >
                                                        {deleteLoadingId === admin.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3 w-3" />
                                                        )}
                                                        Remover
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog para editar permissões */}
            <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            Editar Permissões
                        </DialogTitle>
                        <DialogDescription>
                            Selecione os módulos que <strong>{editTarget?.name}</strong> poderá acessar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2 py-2">
                        {ADMIN_MODULES.map((module) => (
                            <label
                                key={module.key}
                                className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Checkbox
                                    checked={editPermissions.includes(module.key as AdminPermission)}
                                    onCheckedChange={() =>
                                        togglePermission(
                                            module.key as AdminPermission,
                                            editPermissions,
                                            setEditPermissions
                                        )
                                    }
                                    className="mt-0.5"
                                />
                                <div>
                                    <p className="text-sm font-medium">{module.label}</p>
                                    <p className="text-xs text-muted-foreground">{module.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>

                    {editPermissions.length === 0 && (
                        <div className="flex items-center gap-2 text-amber-600 text-xs">
                            <Info className="h-3.5 w-3.5" />
                            <span>Sem módulos selecionados — o operador não terá acesso a nada além do Início.</span>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSavePermissions} disabled={editLoading} className="gap-2">
                            {editLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Salvar permissões
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Dialog para editar papel (super_admin only) */}
            <Dialog open={!!roleEditTarget} onOpenChange={(open) => !open && setRoleEditTarget(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Alterar Papel
                        </DialogTitle>
                        <DialogDescription>
                            Altere o papel de <strong>{roleEditTarget?.name}</strong>. Esta ação afeta imediatamente o acesso deste administrador.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label>Novo papel</Label>
                            <Select
                                value={newRole}
                                onValueChange={(v) => { setNewRole(v as AdminRole); setNewPermissions([]) }}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="master">
                                        <span className="flex items-center gap-2">
                                            <Crown className="h-3.5 w-3.5" />
                                            Master — acesso irrestrito
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="operator">
                                        <span className="flex items-center gap-2">
                                            <UserCog className="h-3.5 w-3.5" />
                                            Operador — acesso limitado
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {newRole === "operator" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Módulos liberados</Label>
                                <div className="grid gap-2">
                                    {ADMIN_MODULES.map((module) => (
                                        <label
                                            key={module.key}
                                            className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                        >
                                            <Checkbox
                                                checked={newPermissions.includes(module.key as AdminPermission)}
                                                onCheckedChange={() =>
                                                    togglePermission(
                                                        module.key as AdminPermission,
                                                        newPermissions,
                                                        setNewPermissions
                                                    )
                                                }
                                                className="mt-0.5"
                                            />
                                            <div>
                                                <p className="text-sm font-medium">{module.label}</p>
                                                <p className="text-xs text-muted-foreground">{module.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {newPermissions.length === 0 && (
                                    <div className="flex items-center gap-2 text-amber-600 text-xs">
                                        <Info className="h-3.5 w-3.5" />
                                        <span>Sem módulos selecionados — o operador não terá acesso a nada além do Início.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleEditTarget(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveRole} disabled={roleEditLoading} className="gap-2">
                            {roleEditLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Salvar papel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
