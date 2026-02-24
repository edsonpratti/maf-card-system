"use server"

import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import type { AdminRole, AdminPermission } from "@/lib/admin-permissions"
import { ADMIN_MODULES } from "@/lib/admin-permissions"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

/** Cria client Supabase com a sessão do admin atual */
async function getSessionClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                },
            },
        }
    )
}

async function getAuthAdmin() {
    const supabase = await getSessionClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const isAdm = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
    return isAdm ? user : null
}

// ─────────────────────────────────────────────
// Buscar dados do perfil admin
// ─────────────────────────────────────────────
export async function getAdminProfile(): Promise<{
    id: string
    email: string
    name: string
    role: AdminRole
    permissions: AdminPermission[]
    createdAt: string
} | null> {
    const user = await getAuthAdmin()
    if (!user) return null

    const { data } = await supabaseAdmin
        .from("admin_users")
        .select("name, role, permissions, created_at")
        .eq("email", user.email!)
        .single()

    return {
        id: user.id,
        email: user.email!,
        name: data?.name || user.user_metadata?.name || user.email!.split("@")[0],
        role: (data?.role as AdminRole) ?? "master",
        permissions: (data?.permissions as AdminPermission[]) ?? [],
        createdAt: data?.created_at ?? user.created_at,
    }
}

// ─────────────────────────────────────────────
// Atualizar nome do admin
// ─────────────────────────────────────────────
export async function updateAdminName(name: string): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getAuthAdmin()
        if (!user) return { success: false, message: "Não autenticado." }

        const trimmed = name.trim()
        if (!trimmed || trimmed.length < 3) {
            return { success: false, message: "Nome deve ter pelo menos 3 caracteres." }
        }

        // Atualizar metadados no auth (funciona para todos, mesmo sem linha na tabela)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, name: trimmed },
        })

        if (authError) {
            console.error("[admin-perfil] updateAdminName auth error:", authError)
            return { success: false, message: "Erro ao atualizar nome. Tente novamente." }
        }

        // Atualizar na tabela admin_users (se existir)
        const { data: existing } = await supabaseAdmin
            .from("admin_users")
            .select("id")
            .eq("email", user.email!)
            .maybeSingle()

        if (existing) {
            await supabaseAdmin
                .from("admin_users")
                .update({ name: trimmed })
                .eq("email", user.email!)
        }

        revalidatePath("/admin/perfil")
        return { success: true, message: "Nome atualizado com sucesso!" }
    } catch (e) {
        console.error("[admin-perfil] updateAdminName exception:", e)
        return { success: false, message: "Erro inesperado. Tente novamente." }
    }
}

// ─────────────────────────────────────────────
// Alterar senha do admin (valida senha atual via tentativa de login)
// ─────────────────────────────────────────────
export async function updateAdminPassword(
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getAuthAdmin()
        if (!user || !user.email) return { success: false, message: "Não autenticado." }

        if (!newPassword || newPassword.length < 8) {
            return { success: false, message: "Nova senha deve ter ao menos 8 caracteres." }
        }

        // 1. Verificar senha atual tentando autenticar com ela
        const verifyClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { error: signInError } = await verifyClient.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        })

        if (signInError) {
            return { success: false, message: "Senha atual incorreta." }
        }

        // 2. Atualizar senha via admin client
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: newPassword,
        })

        if (updateError) {
            console.error("[admin-perfil] updateAdminPassword update error:", updateError)
            return { success: false, message: "Erro ao atualizar senha. Tente novamente." }
        }

        return { success: true, message: "Senha atualizada com sucesso!" }
    } catch (e) {
        console.error("[admin-perfil] updateAdminPassword exception:", e)
        return { success: false, message: "Erro inesperado. Tente novamente." }
    }
}
