"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
    Menu,
    Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
    userEmail?: string
    onLogout: () => void
}

const menuItems = [
    {
        section: null,
        items: [
            { href: "/admin", icon: Home, label: "Início" }
        ]
    },
    {
        section: "MAF Pro ID",
        items: [
            { href: "/admin/solicitacoes", icon: FileText, label: "Solicitações" },
            { href: "/admin/base-alunas", icon: Users, label: "Base de Alunas" },
            { href: "/admin/configuracoes", icon: Settings, label: "Configurações" },
        ]
    },
    {
        section: "MAF Pro Quiz",
        items: [
            { href: "/admin/enquetes", icon: ClipboardList, label: "Enquetes" },
        ]
    },
    {
        section: "Gestão",
        items: [
            { href: "/admin/usuarios", icon: UserCheck, label: "Usuários" },
            { href: "/admin/logs", icon: Database, label: "Logs de Auditoria" },
        ]
    }
]

export function Sidebar({ userEmail, onLogout }: SidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem("sidebar-collapsed")
        if (saved !== null) {
            setCollapsed(JSON.parse(saved))
        }
    }, [])

    const toggleCollapsed = () => {
        const newValue = !collapsed
        setCollapsed(newValue)
        localStorage.setItem("sidebar-collapsed", JSON.stringify(newValue))
    }

    // Evitar flash de conteúdo durante hidratação
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
            {/* Header */}
            <div className={cn(
                "flex h-14 items-center border-b font-bold text-lg",
                collapsed ? "justify-center px-2" : "justify-between px-6"
            )}>
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

            {/* Navigation */}
            <nav className="flex-1 overflow-auto py-4">
                <ul className={cn(
                    "grid gap-1 text-sm font-medium",
                    collapsed ? "px-2" : "px-4"
                )}>
                    {menuItems.map((group, groupIndex) => (
                        <li key={groupIndex}>
                            {/* Section Header */}
                            {group.section && (
                                <div className={cn(
                                    "mt-4 mb-2",
                                    collapsed ? "px-0 text-center" : "px-3"
                                )}>
                                    {collapsed ? (
                                        <div className="h-px bg-border mx-1" />
                                    ) : (
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {group.section}
                                        </span>
                                    )}
                                </div>
                            )}
                            
                            {/* Menu Items */}
                            <ul className="grid gap-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href || 
                                        (item.href !== "/admin" && pathname.startsWith(item.href))
                                    
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
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className={cn(
                "border-t",
                collapsed ? "p-2" : "p-4"
            )}>
                {userEmail && !collapsed && (
                    <div className="mb-2 px-3 text-xs text-muted-foreground truncate">
                        {userEmail}
                    </div>
                )}
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

// Componente para o botão mobile de abrir sidebar
export function MobileSidebarTrigger({ 
    userEmail, 
    onLogout 
}: SidebarProps) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Botão de menu mobile */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-50"
                onClick={() => setOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Overlay */}
            {open && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
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
                        {menuItems.map((group, groupIndex) => (
                            <li key={groupIndex}>
                                {group.section && (
                                    <div className="mt-4 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {group.section}
                                    </div>
                                )}
                                
                                <ul className="grid gap-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon
                                        const isActive = pathname === item.href || 
                                            (item.href !== "/admin" && pathname.startsWith(item.href))
                                        
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
                        ))}
                    </ul>
                </nav>

                <div className="border-t p-4">
                    {userEmail && (
                        <div className="mb-2 px-3 text-xs text-muted-foreground">
                            {userEmail}
                        </div>
                    )}
                    <form action={onLogout}>
                        <Button type="submit" variant="ghost" className="w-full justify-start gap-3">
                            <LogOut className="h-4 w-4" />
                            Sair
                        </Button>
                    </form>
                </div>
            </aside>
        </>
    )
}
