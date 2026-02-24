"use server"

import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { emailChangeVerificationTemplate } from "@/lib/email-templates"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

// Cliente admin para operações privilegiadas (bypass RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

/** Cria client Supabase com a sessão do usuário atual */
async function getSessionClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
            },
        }
    )
}

/** Retorna o usuário autenticado ou null */
async function getAuthUser() {
    const supabase = await getSessionClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

// ─────────────────────────────────────────────
// Atualizar nome
// ─────────────────────────────────────────────
export async function updateName(name: string): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getAuthUser()
        if (!user) return { success: false, message: "Não autenticado." }

        const trimmed = name.trim()
        if (!trimmed || trimmed.length < 3) {
            return { success: false, message: "Nome deve ter pelo menos 3 caracteres." }
        }

        const { error } = await supabaseAdmin
            .from("users_cards")
            .update({ name: trimmed })
            .eq("auth_user_id", user.id)

        if (error) {
            console.error("[perfil] updateName error:", error)
            return { success: false, message: "Erro ao atualizar nome. Tente novamente." }
        }

        revalidatePath("/portal/perfil")
        return { success: true, message: "Nome atualizado com sucesso!" }
    } catch (e) {
        console.error("[perfil] updateName exception:", e)
        return { success: false, message: "Erro inesperado. Tente novamente." }
    }
}

// ─────────────────────────────────────────────
// Atualizar WhatsApp
// ─────────────────────────────────────────────
export async function updateWhatsApp(whatsapp: string): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getAuthUser()
        if (!user) return { success: false, message: "Não autenticado." }

        // Remove tudo que não for dígito para validar
        const digits = whatsapp.replace(/\D/g, "")
        if (digits && (digits.length < 10 || digits.length > 15)) {
            return { success: false, message: "WhatsApp inválido. Informe com DDD (ex: 11999999999)." }
        }

        const { error } = await supabaseAdmin
            .from("users_cards")
            .update({ whatsapp: digits || null })
            .eq("auth_user_id", user.id)

        if (error) {
            console.error("[perfil] updateWhatsApp error:", error)
            return { success: false, message: "Erro ao atualizar WhatsApp. Tente novamente." }
        }

        revalidatePath("/portal/perfil")
        return { success: true, message: "WhatsApp atualizado com sucesso!" }
    } catch (e) {
        console.error("[perfil] updateWhatsApp exception:", e)
        return { success: false, message: "Erro inesperado. Tente novamente." }
    }
}

// ─────────────────────────────────────────────
// Solicitar troca de email (envia verificação para o novo email)
// ─────────────────────────────────────────────
export async function requestEmailChange(
    newEmail: string
): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getAuthUser()
        if (!user) return { success: false, message: "Não autenticado." }

        const emailLower = newEmail.trim().toLowerCase()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(emailLower)) {
            return { success: false, message: "Email inválido." }
        }

        if (emailLower === user.email?.toLowerCase()) {
            return { success: false, message: "O novo email é igual ao atual." }
        }

        // Verificar se o email já está em uso por outra conta
        const { data: existing } = await supabaseAdmin
            .from("users_cards")
            .select("id")
            .eq("email", emailLower)
            .neq("auth_user_id", user.id)
            .maybeSingle()

        if (existing) {
            return { success: false, message: "Este email já está cadastrado em outra conta." }
        }

        // Buscar nome do usuário para o email
        const { data: userCard } = await supabaseAdmin
            .from("users_cards")
            .select("name")
            .eq("auth_user_id", user.id)
            .single()

        const name = userCard?.name || "Usuária"

        // Invalidar tokens anteriores não usados
        await supabaseAdmin
            .from("email_change_tokens")
            .update({ used: true, used_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("used", false)

        // Gerar novo token
        const token = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

        const { error: insertError } = await supabaseAdmin
            .from("email_change_tokens")
            .insert({
                user_id: user.id,
                old_email: user.email,
                new_email: emailLower,
                token,
                expires_at: expiresAt.toISOString(),
            })

        if (insertError) {
            console.error("[perfil] requestEmailChange insert error:", insertError)
            return { success: false, message: "Erro ao processar solicitação. Tente novamente." }
        }

        // Enviar email de confirmação para o NOVO endereço
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mafpro.amandafernandes.com"
        const confirmLink = `${appUrl}/portal/perfil/confirmar-email/${token}`

        const { error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "MAF Pro <noreply@mafpro.amandafernandes.com>",
            to: emailLower,
            subject: "Confirme seu novo email - MAF Pro",
            html: emailChangeVerificationTemplate(name, confirmLink, emailLower, expiresAt),
        })

        if (emailError) {
            console.error("[perfil] requestEmailChange send email error:", emailError)
            // Desfaz o token inserido
            await supabaseAdmin.from("email_change_tokens").delete().eq("token", token)
            return { success: false, message: "Erro ao enviar email de confirmação. Tente novamente." }
        }

        return {
            success: true,
            message: `Email de confirmação enviado para ${emailLower}. Verifique sua caixa de entrada.`,
        }
    } catch (e) {
        console.error("[perfil] requestEmailChange exception:", e)
        return { success: false, message: "Erro inesperado. Tente novamente." }
    }
}

// ─────────────────────────────────────────────
// Confirmar troca de email (chamado pela página do token)
// ─────────────────────────────────────────────
export async function confirmEmailChange(
    token: string
): Promise<{ success: boolean; message: string; newEmail?: string }> {
    try {
        if (!token) return { success: false, message: "Token inválido." }

        // Buscar token
        const { data, error } = await supabaseAdmin
            .from("email_change_tokens")
            .select("*")
            .eq("token", token)
            .eq("used", false)
            .single()

        if (error || !data) {
            return { success: false, message: "Link inválido ou já utilizado." }
        }

        // Verificar expiração
        if (new Date() > new Date(data.expires_at)) {
            return { success: false, message: "Link expirado. Solicite uma nova troca de email." }
        }

        // Atualizar email no auth.users via admin
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
            email: data.new_email,
        })

        if (authError) {
            console.error("[perfil] confirmEmailChange auth update error:", authError)
            return { success: false, message: "Erro ao atualizar email. Tente novamente." }
        }

        // Atualizar email na tabela users_cards
        const { error: cardError } = await supabaseAdmin
            .from("users_cards")
            .update({ email: data.new_email })
            .eq("auth_user_id", data.user_id)

        if (cardError) {
            console.error("[perfil] confirmEmailChange users_cards update error:", cardError)
            // Não bloqueia - email no auth já foi atualizado
        }

        // Marcar token como usado
        await supabaseAdmin
            .from("email_change_tokens")
            .update({ used: true, used_at: new Date().toISOString() })
            .eq("token", token)

        return {
            success: true,
            message: "Email atualizado com sucesso! Faça login com o novo endereço.",
            newEmail: data.new_email,
        }
    } catch (e) {
        console.error("[perfil] confirmEmailChange exception:", e)
        return { success: false, message: "Erro inesperado. Tente novamente." }
    }
}

// ─────────────────────────────────────────────
// Solicitar troca de senha (envia link por email)
// ─────────────────────────────────────────────
export async function requestPasswordChange(): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getAuthUser()
        if (!user || !user.email) return { success: false, message: "Não autenticado." }

        // Reutiliza a action existente de recuperar senha
        const { solicitarRecuperacaoSenha } = await import("./recuperar-senha")
        const result = await solicitarRecuperacaoSenha(user.email)

        return result
    } catch (e) {
        console.error("[perfil] requestPasswordChange exception:", e)
        return { success: false, message: "Erro inesperado. Tente novamente." }
    }
}

// ─────────────────────────────────────────────
// Upload de foto de perfil
// ─────────────────────────────────────────────
export async function uploadProfilePhoto(
    formData: FormData
): Promise<{ success: boolean; message: string; photoUrl?: string }> {
    try {
        const user = await getAuthUser()
        if (!user) return { success: false, message: "Não autenticado." }

        const file = formData.get("photo") as File | null
        if (!file) return { success: false, message: "Nenhum arquivo selecionado." }

        // Validações
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!allowedTypes.includes(file.type)) {
            return { success: false, message: "Formato inválido. Use JPEG, PNG ou WebP." }
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return { success: false, message: "Arquivo muito grande. Tamanho máximo: 5MB." }
        }

        // Converter para ArrayBuffer
        const buffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(buffer)

        // Extensão do arquivo
        const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
        const storagePath = `${user.id}/profile.${ext}`

        // Upload para o bucket 'photos'
        const { error: uploadError } = await supabaseAdmin.storage
            .from("photos")
            .upload(storagePath, fileBuffer, {
                contentType: file.type,
                upsert: true, // sobrescreve se já existir
            })

        if (uploadError) {
            console.error("[perfil] uploadProfilePhoto storage error:", uploadError)
            return { success: false, message: "Erro ao enviar foto. Tente novamente." }
        }

        // Obter URL pública
        const { data: urlData } = supabaseAdmin.storage.from("photos").getPublicUrl(storagePath)
        const photoUrl = urlData.publicUrl

        // Atualizar path na tabela users_cards
        const { error: updateError } = await supabaseAdmin
            .from("users_cards")
            .update({ photo_path: storagePath })
            .eq("auth_user_id", user.id)

        if (updateError) {
            console.error("[perfil] uploadProfilePhoto db update error:", updateError)
            return { success: false, message: "Foto enviada, mas erro ao salvar. Tente novamente." }
        }

        revalidatePath("/portal/perfil")
        return { success: true, message: "Foto atualizada com sucesso!", photoUrl }
    } catch (e) {
        console.error("[perfil] uploadProfilePhoto exception:", e)
        return { success: false, message: "Erro inesperado. Tente novamente." }
    }
}

// ─────────────────────────────────────────────
// Remover foto de perfil
// ─────────────────────────────────────────────
export async function removeProfilePhoto(): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getAuthUser()
        if (!user) return { success: false, message: "Não autenticado." }

        // Buscar path atual
        const { data: userCard } = await supabaseAdmin
            .from("users_cards")
            .select("photo_path")
            .eq("auth_user_id", user.id)
            .single()

        if (userCard?.photo_path) {
            // Remover do storage
            await supabaseAdmin.storage.from("photos").remove([userCard.photo_path])
        }

        // Limpar path na tabela
        const { error } = await supabaseAdmin
            .from("users_cards")
            .update({ photo_path: null })
            .eq("auth_user_id", user.id)

        if (error) {
            return { success: false, message: "Erro ao remover foto. Tente novamente." }
        }

        revalidatePath("/portal/perfil")
        return { success: true, message: "Foto removida com sucesso." }
    } catch (e) {
        console.error("[perfil] removeProfilePhoto exception:", e)
        return { success: false, message: "Erro inesperado. Tente novamente." }
    }
}
