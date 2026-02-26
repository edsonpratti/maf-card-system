"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Users, FileText, Database, Shield, LogOut, UserCheck, Home, ClipboardList, X, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"

interface AdminMobileNavProps {
    userEmail?: string
    onLogout: () => void
}

const navItems = [
    { href: "/admin", label: "Início", icon: Home, section: null },
    { section: "MAF Pro ID" },
    { href: "/admin/dashboard", label: "Dashboard", icon: Shield },
    { href: "/admin/solicitacoes", label: "Solicitações", icon: FileText },
    { href: "/admin/alunas-cadastradas", label: "Alunas Cadastradas", icon: UserCheck },
    { href: "/admin/base-alunas", label: "Base de Alunas", icon: Users },
    { section: "MAF Pro Quiz" },
    { href: "/admin/enquetes", label: "Enquetes", icon: ClipboardList },
    { href: "/resultados-enquetes", label: "Dashboard Público", icon: BarChart3 },
    { section: "Sistema" },
    { href: "/admin/logs", label: "Logs de Auditoria", icon: Database },
]

export function AdminMobileNav({ userEmail, onLogout }: AdminMobileNavProps) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden h-9 w-9 p-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-left font-bold text-lg">MAF Pro Admin</SheetTitle>
                </SheetHeader>
                <nav className="flex-1 overflow-auto py-4">
                    <ul className="grid gap-1 px-2 text-sm font-medium">
                        {navItems.map((item, index) => {
                            if (item.section && !item.href) {
                                return (
                                    <li key={`section-${index}`} className="mt-4 mb-2 first:mt-0">
                                        <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {item.section}
                                        </div>
                                    </li>
                                )
                            }
                            
                            if (item.href && item.icon) {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.href}>
                                        <SheetClose asChild>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                                                    isActive 
                                                        ? "bg-primary text-primary-foreground" 
                                                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {item.label}
                                            </Link>
                                        </SheetClose>
                                    </li>
                                )
                            }
                            return null
                        })}
                    </ul>
                </nav>
                <div className="border-t p-4 mt-auto">
                    {userEmail && (
                        <div className="mb-3 px-1 text-xs text-muted-foreground truncate">
                            {userEmail}
                        </div>
                    )}
                    <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full justify-start gap-3"
                        onClick={() => {
                            setOpen(false)
                            onLogout()
                        }}
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
