import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAdminProfile } from "@/app/actions/admin-perfil"
import { AdminProfileForm } from "@/components/admin/admin-profile-form"
import { Badge } from "@/components/ui/badge"
import { ROLE_LABELS } from "@/lib/admin-permissions"

export const metadata = {
    title: "Meu Perfil | MAF Pro Admin",
    description: "Gerencie seus dados e senha de administrador.",
}

export default async function AdminPerfilPage() {
    const profile = await getAdminProfile()

    if (!profile) {
        redirect("/admin/login")
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
                    <Link href="/admin">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Voltar ao painel
                    </Link>
                </Button>

                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <UserCircle className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold">Meu Perfil</h1>
                            <Badge
                                variant={profile.role === "master" ? "default" : "secondary"}
                                className="text-xs"
                            >
                                {ROLE_LABELS[profile.role]}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                </div>
            </div>

            {/* Formulário */}
            <AdminProfileForm profile={profile} />
        </div>
    )
}
