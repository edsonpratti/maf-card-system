import { adminLogout, getCurrentAdmin } from "@/app/actions/admin"
import { getMyAdminInfo } from "@/app/actions/admin-users"
import { DashboardShell } from "@/components/admin/dashboard-shell"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentAdmin()
    
    if (!user) {
        redirect("/admin/login")
    }
    
    const isAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
    if (!isAdmin) {
        redirect("/")
    }

    const adminInfo = await getMyAdminInfo()
    
    return (
        <DashboardShell 
            userEmail={user?.email}
            adminRole={adminInfo?.role ?? "master"}
            adminPermissions={adminInfo?.permissions ?? []}
            logoutAction={adminLogout}
        >
            {children}
        </DashboardShell>
    )
}
