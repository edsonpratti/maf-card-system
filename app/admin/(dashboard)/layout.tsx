import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, FileText, Database, Shield, LogOut, UserCheck, Home, ClipboardList } from "lucide-react"
import { adminLogout, getCurrentAdmin } from "@/app/actions/admin"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentAdmin()
    return (
        <div className="flex h-screen bg-muted/40">
            <aside className="hidden w-64 flex-col border-r bg-background lg:flex">
                <div className="flex h-14 items-center border-b px-6 font-bold text-lg">
                    MAF Pro Admin
                </div>
                <nav className="flex-1 overflow-auto py-4">
                    <ul className="grid gap-1 px-4 text-sm font-medium">
                        <li>
                            <Link
                                href="/admin"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Home className="h-4 w-4" />
                                Início
                            </Link>
                        </li>

                        <li className="mt-4 mb-2">
                            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                MAF Pro ID
                            </div>
                        </li>
                        <li>
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Shield className="h-4 w-4" />
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/admin/solicitacoes"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <FileText className="h-4 w-4" />
                                Solicitações
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/admin/alunas-cadastradas"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <UserCheck className="h-4 w-4" />
                                Alunas Cadastradas
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/admin/base-alunas"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Users className="h-4 w-4" />
                                Base de Alunas
                            </Link>
                        </li>

                        <li className="mt-4 mb-2">
                            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                MAF Pro Quiz
                            </div>
                        </li>
                        <li>
                            <Link
                                href="/admin/enquetes"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ClipboardList className="h-4 w-4" />
                                Enquetes
                            </Link>
                        </li>

                        <li className="mt-4 mb-2">
                            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Sistema
                            </div>
                        </li>
                        <li>
                            <Link
                                href="/admin/logs"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Database className="h-4 w-4" />
                                Logs de Auditoria
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div className="border-t p-4">
                    {user && (
                        <div className="mb-2 px-3 text-xs text-muted-foreground">
                            {user.email}
                        </div>
                    )}
                    <form action={adminLogout}>
                        <Button type="submit" variant="ghost" className="w-full justify-start gap-3">
                            <LogOut className="h-4 w-4" />
                            Sair
                        </Button>
                    </form>
                </div>
            </aside>
            <main className="flex-1 overflow-auto p-4 lg:p-6">
                {children}
            </main>
        </div>
    )
}
