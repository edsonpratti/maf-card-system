"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Users,
    FileText,
    Database,
    LogOut,
    UserCheck,
    Home,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Menu,
    Settings,
    CreditCard,
    HelpCircle,
    LayoutDashboard,
    ListTodo,
    Shield,
    UserCircle,
    FolderKanban,
    BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdminRole, AdminPermission } from "@/lib/admin-permissions"
import { hasPermission } from "@/lib/admin-permissions"

interface SidebarProps {
    userEmail?: string
    onLogout: () => void
    adminRole?: AdminRole
    adminPermissions?: AdminPermission[]
}

interface MenuItem {
    href: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    permission?: AdminPermission
    masterOnly?: boolean
}

interface MenuGroup {
    section: string | null
    sectionIcon: React.ComponentType<{ className?: string }> | null
    items: MenuItem[]
}

const menuItems: MenuGroup[] = [
    {
        section: null,
        sectionIcon: null,
        items: [
            { href: "/admin", icon: Home, label: "Início" },
        ],
    },
    {
        section: "MAF Pro ID",
        sectionIcon: CreditCard,
        items: [
            { href: "/admin/solicitacoes", icon: FileText, label: "Solicitações", permission: "maf-pro-id" },
            { href: "/admin/base-alunas", icon: Users, label: "Base de Alunas", permission: "maf-pro-id" },
            { href: "/admin/configuracoes", icon: Settings, label: "Configurações", permission: "maf-pro-id" },
        ],
    },
    {
        section: "MAF Pro Quiz",
        sectionIcon: HelpCircle,
        items: [
            { href: "/admin/enquetes", icon: ClipboardList, label: "Enquetes", permission: "maf-pro-quiz" },
            { href: "/resultados-enquetes", icon: BarChart3, label: "Dashboard Público", permission: "maf-pro-quiz" },
        ],
    },
    {
        section: "MAF Pro Tasks",
        sectionIcon: ListTodo,
        items: [
            { href: "/admin/tarefas/dashboard",       icon: LayoutDashboard, label: "Dashboard",      permission: "maf-pro-tasks" },
            { href: "/admin/tarefas/projetos",         icon: FolderKanban,    label: "Projetos",        permission: "maf-pro-tasks" },
            { href: "/admin/tarefas/minhas-tarefas",  icon: UserCircle,      label: "Minhas Tarefas",  permission: "maf-pro-tasks" },
        ],
    },
    {
        section: "Gestão",
        sectionIcon: LayoutDashboard,
        items: [
            { href: "/admin/usuarios", icon: UserCheck, label: "Usuários", permission: "usuarios" },
            { href: "/admin/admin-users", icon: Shield, label: "Usuários Admin", masterOnly: true },
            { href: "/admin/logs", icon: Database, label: "Logs de Auditoria", permission: "logs" },
        ],
    },
]

function isItemVisible(
    item: MenuItem,
    role: AdminRole,
    permissions: AdminPermission[]
): boolean {
    if (item.masterOnly) return role === "master" || role === "super_admin"
    if (!item.permission) return true
    return hasPermission(role, permissions, item.permission)
}

function getVisibleItems(
    group: MenuGroup,
    role: AdminRole,
    permissions: AdminPermission[]
): MenuItem[] {
    return group.items.filter((item) => isItemVisible(item, role, permissions))
}

export function Sidebar({ userEmail, onLogout, adminRole = "master", adminPermissions = [] }: SidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem("sidebar-collapsed")
        if (saved !== null) {
            setCollapsed(JSON.parse(saved))
        }

        const initialOpen: Record<string, boolean> = {}
        menuItems.forEach((group) => {
            if (group.section) {
                const hasActive = group.items.some(
                    (item) =>
                        pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(item.href))
                )
                initialOpen[group.section] = hasActive
            }
        })
        setOpenSections(initialOpen)
    }, [pathname])

    const toggleCollapsed = () => {
        const newValue = !collapsed
        setCollapsed(newValue)
        localStorage.setItem("sidebar-collapsed", JSON.stringify(newValue))
    }

    const toggleSection = (section: string) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
    }

    if (!mounted) {
        return (
            <aside className="hidden w-64 flex-col border-r bg-background lg:flex">
                <div className="flex h-14 items-center border-b px-6 font-bold text-lg">
                    MAF Pro Admin
                </div>
            </aside>
        )
    }

    return (
        <aside
            className={cn(
                "hidden flex-col border-r bg-background lg:flex transition-all duration-300 ease-in-out",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <div
                className={cn(
                    "flex h-14 items-center border-b font-bold text-lg",
                    collapsed ? "justify-center px-2" : "justify-between px-6"
                )}
            >
                {!collapsed && <span>MAF Pro Admin</span>}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapsed}
                    className="h-8 w-8 shrink-0"
                    title={collapsed ? "Expandir menu" : "Recolher menu"}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <nav className="flex-1 overflow-auto py-4">
                <ul
                    className={cn(
                        "grid gap-1 text-sm font-medium",
                        collapsed ? "px-2" : "px-4"
                    )}
                >
                    {menuItems.map((group, groupIndex) => {
                        const visibleItems = getVisibleItems(group, adminRole, adminPermissions)
                        if (visibleItems.length === 0) return null

                        const isOpen = group.section
                            ? (openSections[group.section] ?? false)
                            : true
                        const SectionIcon = group.sectionIcon

                        return (
                            <li key={groupIndex}>
                                {group.section && (
                                    <div className={cn("mt-3 mb-1", collapsed ? "px-0" : "")}>
                                        {collapsed ? (
                                            <div className="h-px bg-border mx-1 mt-2" />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => toggleSection(group.section!)}
                                                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted hover:text-foreground transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {SectionIcon && (
                                                        <SectionIcon className="h-3.5 w-3.5" />
                                                    )}
                                                    <span>{group.section}</span>
                                                </div>
                                                <ChevronDown
                                                    className={cn(
                                                        "h-3.5 w-3.5 transition-transform duration-200",
                                                        isOpen ? "rotate-0" : "-rotate-90"
                                                    )}
                                                />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <ul
                                    className={cn(
                                        "grid gap-1 overflow-hidden transition-all duration-200",
                                        !collapsed && group.section && !isOpen
                                            ? "max-h-0 opacity-0"
                                            : "max-h-96 opacity-100"
                                    )}
                                >
                                    {visibleItems.map((item) => {
                                        const Icon = item.icon
                                        const isActive =
                                            pathname === item.href ||
                                            (item.href !== "/admin" &&
                                                pathname.startsWith(item.href))

                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "flex items-center rounded-lg transition-all hover:text-primary",
                                                        collapsed
                                                            ? "justify-center p-2"
                                                            : "gap-3 px-3 py-2",
                                                        isActive
                                                            ? "bg-primary/10 text-primary"
                                                            : "text-muted-foreground"
                                                    )}
                                                    title={collapsed ? item.label : undefined}
                                                >
                                                    <Icon className="h-4 w-4 shrink-0" />
                                                    {!collapsed && <span>{item.label}</span>}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className={cn("border-t", collapsed ? "p-2" : "p-4")}>
                {!collapsed && (
                    <div className="mb-3 px-3 space-y-1">
                        {userEmail && (
                            <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                        )}
                        <Badge
                            variant={adminRole === "master" ? "default" : "secondary"}
                            className="text-xs"
                        >
                            {adminRole === "master" ? "Master" : "Operador"}
                        </Badge>
                    </div>
                )}
                <Link
                    href="/admin/perfil"
                    className={cn(
                        "flex items-center rounded-lg transition-all hover:text-primary text-muted-foreground mb-1",
                        collapsed
                            ? "justify-center p-2"
                            : "gap-3 px-3 py-2"
                    )}
                    title={collapsed ? "Meu Perfil" : undefined}
                >
                    <UserCircle className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Meu Perfil</span>}
                </Link>
                <form action={onLogout}>
                    <Button
                        type="submit"
                        variant="ghost"
                        className={cn(
                            collapsed
                                ? "w-full justify-center p-2"
                                : "w-full justify-start gap-3"
                        )}
                        title={collapsed ? "Sair" : undefined}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Sair</span>}
                    </Button>
                </form>
            </div>
        </aside>
    )
}

export function MobileSidebarTrigger({
    userEmail,
    onLogout,
    adminRole = "master",
    adminPermissions = [],
}: SidebarProps) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
        const initialOpen: Record<string, boolean> = {}
        menuItems.forEach((group) => {
            if (group.section) {
                initialOpen[group.section] = true
            }
        })
        return initialOpen
    })

    const toggleSection = (section: string) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-50"
                onClick={() => setOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 w-64 flex-col border-r bg-background z-50 lg:hidden transition-transform duration-300",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-14 items-center justify-between border-b px-6 font-bold text-lg">
                    <span>MAF Pro Admin</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>

                <nav className="flex-1 overflow-auto py-4">
                    <ul className="grid gap-1 px-4 text-sm font-medium">
                        {menuItems.map((group, groupIndex) => {
                            const visibleItems = getVisibleItems(group, adminRole, adminPermissions)
                            if (visibleItems.length === 0) return null

                            const isOpen = group.section
                                ? (openSections[group.section] ?? true)
                                : true
                            const SectionIcon = group.sectionIcon

                            return (
                                <li key={groupIndex}>
                                    {group.section && (
                                        <div className="mt-3 mb-1">
                                            <button
                                                type="button"
                                                onClick={() => toggleSection(group.section!)}
                                                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted hover:text-foreground transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {SectionIcon && (
                                                        <SectionIcon className="h-3.5 w-3.5" />
                                                    )}
                                                    <span>{group.section}</span>
                                                </div>
                                                <ChevronDown
                                                    className={cn(
                                                        "h-3.5 w-3.5 transition-transform duration-200",
                                                        isOpen ? "rotate-0" : "-rotate-90"
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    )}

                                    <ul
                                        className={cn(
                                            "grid gap-1 overflow-hidden transition-all duration-200",
                                            group.section && !isOpen
                                                ? "max-h-0 opacity-0"
                                                : "max-h-96 opacity-100"
                                        )}
                                    >
                                        {visibleItems.map((item) => {
                                            const Icon = item.icon
                                            const isActive =
                                                pathname === item.href ||
                                                (item.href !== "/admin" &&
                                                    pathname.startsWith(item.href))

                                            return (
                                                <li key={item.href}>
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => setOpen(false)}
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                                            isActive
                                                                ? "bg-primary/10 text-primary"
                                                                : "text-muted-foreground"
                                                        )}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="border-t p-4">
                    <div className="mb-3 px-3 space-y-1">
                        {userEmail && (
                            <div className="text-xs text-muted-foreground">{userEmail}</div>
                        )}
                        <Badge
                            variant={adminRole === "master" ? "default" : "secondary"}
                            className="text-xs"
                        >
                            {adminRole === "master" ? "Master" : "Operador"}
                        </Badge>
                    </div>
                    <Link
                        href="/admin/perfil"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all mb-1"
                    >
                        <UserCircle className="h-4 w-4" />
                        Meu Perfil
                    </Link>
                    <form action={onLogout}>
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full justify-start gap-3"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </Button>
                    </form>
                </div>
            </aside>
        </>
    )
}
