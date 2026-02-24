import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileForm } from "@/components/perfil/profile-form"

export const metadata = {
    title: "Meu Perfil | MAF Pro",
    description: "Gerencie seus dados pessoais, email, senha e foto de perfil.",
}

export default async function PerfilPage() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Buscar dados do perfil (users_cards)
    const { data: profile } = await supabase
        .from("users_cards")
        .select("name, cpf, whatsapp, email, card_number, status, photo_path, certification_date")
        .eq("auth_user_id", user.id)
        .single()

    if (!profile) {
        redirect("/portal")
    }

    // Montar URL pública da foto se existir
    let photoUrl: string | null = null
    if (profile.photo_path) {
        const { data: urlData } = supabase.storage
            .from("photos")
            .getPublicUrl(profile.photo_path)
        photoUrl = urlData.publicUrl
    }

    return (
        <div className="container max-w-3xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
            {/* Header */}
            <div className="mb-8">
                <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
                    <Link href="/portal">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Voltar ao Portal
                    </Link>
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <UserCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Meu Perfil</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie seus dados pessoais e de acesso
                        </p>
                    </div>
                </div>
            </div>

            {/* Formulário com abas */}
            <ProfileForm
                user={{ id: user.id, email: user.email! }}
                profile={profile}
                photoUrl={photoUrl}
            />
        </div>
    )
}
