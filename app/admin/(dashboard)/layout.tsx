import { adminLogout, getCurrentAdmin } from "@/app/actions/admin"
import { DashboardShell } from "@/components/admin/dashboard-shell"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentAdmin()
    
    // Verificar se o usuário está autenticado
    if (!user) {
        redirect("/admin/login")
    }
    
    // Verificar se o usuário é admin
    const isAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
    if (!isAdmin) {
        redirect("/")
    }
    
    return (
        <DashboardShell 
            userEmail={user?.email} 
            logoutAction={adminLogout}
        >
            {children}
        </DashboardShell>
    )
}
