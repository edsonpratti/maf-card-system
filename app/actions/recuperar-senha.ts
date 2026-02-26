"use server"

import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { passwordResetEmailTemplate } from "@/lib/email-templates"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

// Cliente admin do Supabase
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export interface RecuperarSenhaResult {
    success: boolean
    message: string
}

/**
 * Solicita recuperação de senha
 * Envia email com link de reset via Resend
 * Apenas usuários que já completaram o primeiro acesso (validados/ativados) podem recuperar senha
 */
export async function solicitarRecuperacaoSenha(email: string): Promise<RecuperarSenhaResult> {
    try {
        // 1. Buscar dados do usuário na tabela users_cards
        const { data: userCard, error: userCardError } = await supabaseAdmin
            .from("users_cards")
            .select("id, name, email, auth_user_id, first_access_completed")
            .eq("email", email)
            .single()

        // Se não encontrou na tabela ou ocorreu erro, retorna mensagem genérica por segurança
        if (userCardError || !userCard) {
            return {
                success: true,
                message: "Se o email estiver cadastrado e ativado, você receberá as instruções em breve."
            }
        }

        // 2. Verificar se o usuário já completou o primeiro acesso (está ativado)
        // Apenas usuários com auth_user_id ou first_access_completed podem recuperar senha
        if (!userCard.auth_user_id) {
            return {
                success: true,
                message: "Se o email estiver cadastrado e ativado, você receberá as instruções em breve."
            }
        }

        // 3. Verificar se o email existe no auth.users do Supabase
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (userError) {
            console.error("Erro ao buscar usuários:", userError)
            return {
                success: false,
                message: "Erro ao processar solicitação. Tente novamente."
            }
        }

        const user = userData.users.find(u => u.email === email)
        
        if (!user) {
            // Por segurança, retornar mensagem genérica mesmo se email não existir no auth
            return {
                success: true,
                message: "Se o email estiver cadastrado e ativado, você receberá as instruções em breve."
            }
        }

        // Usar o nome da tabela users_cards
        const name = userCard.name || "Usuária"

        // 4. Gerar token de recuperação
        const resetToken = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

        // 5. Salvar token no banco (usar admin para bypass RLS)
        const { error: insertError } = await supabaseAdmin
            .from("password_reset_tokens")
            .insert({
                user_id: user.id,
                email: email,
                token: resetToken,
                expires_at: expiresAt.toISOString(),
                used: false
            })
            .select()

        if (insertError) {
            console.error("Erro ao salvar token:", insertError)
            return {
                success: false,
                message: "Erro ao processar solicitação. Tente novamente."
            }
        }

        // 6. Montar link de recuperação
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mafpro.amandafernandes.com"
        const resetLink = `${siteUrl}/recuperar-senha/${resetToken}`

        // 7. Enviar email via Resend
        
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com",
            to: email,
            subject: "🔒 Recuperação de Senha - MAF Card System",
            html: passwordResetEmailTemplate(name, resetLink, expiresAt)
        })

        if (emailError) {
            console.error("🔑 [RECUPERAR_SENHA] Erro ao enviar email:", emailError)
            return {
                success: false,
                message: "Erro ao enviar email. Tente novamente."
            }
        }

        return {
            success: true,
            message: "Email de recuperação enviado! Verifique sua caixa de entrada."
        }

    } catch (error) {
        console.error("Erro ao solicitar recuperação de senha:", error)
        return {
            success: false,
            message: "Erro inesperado. Tente novamente."
        }
    }
}

/**
 * Valida token de recuperação de senha
 */
export async function validarTokenRecuperacao(token: string): Promise<{
    valid: boolean
    email?: string
    message?: string
}> {
    try {
        const { data, error } = await supabaseAdmin
            .from("password_reset_tokens")
            .select("*")
            .eq("token", token)
            .eq("used", false)
            .single()

        if (error) {
            console.error("Erro ao buscar token:", error)
            return { valid: false, message: "Token inválido ou expirado." }
        }

        if (!data) {
            return { valid: false, message: "Token inválido ou expirado." }
        }

        const now = new Date()
        const expiresAt = new Date(data.expires_at)

        if (now > expiresAt) {
            return { valid: false, message: "Token expirado. Solicite um novo link." }
        }

        return { valid: true, email: data.email }

    } catch (error) {
        console.error("Erro ao validar token:", error)
        return { valid: false, message: "Erro ao validar token." }
    }
}

/**
 * Redefine a senha do usuário
 */
export async function redefinirSenha(token: string, novaSenha: string): Promise<RecuperarSenhaResult> {
    try {
        // 0. Validar força da senha antes de qualquer operação
        if (!novaSenha || novaSenha.length < 8) {
            return { success: false, message: "A senha deve ter pelo menos 8 caracteres." }
        }
        if (!/[A-Z]/.test(novaSenha)) {
            return { success: false, message: "A senha deve conter pelo menos uma letra maiúscula." }
        }
        if (!/[0-9]/.test(novaSenha)) {
            return { success: false, message: "A senha deve conter pelo menos um número." }
        }

        // 1. Validar token
        const validation = await validarTokenRecuperacao(token)
        
        if (!validation.valid || !validation.email) {
            return {
                success: false,
                message: validation.message || "Token inválido."
            }
        }

        // 2. Buscar usuário
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (userError) {
            return {
                success: false,
                message: "Erro ao processar solicitação."
            }
        }

        const user = userData.users.find(u => u.email === validation.email)
        
        if (!user) {
            return {
                success: false,
                message: "Usuário não encontrado."
            }
        }

        // 3. Atualizar senha
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: novaSenha }
        )

        if (updateError) {
            console.error("Erro ao atualizar senha:", updateError)
            return {
                success: false,
                message: "Erro ao atualizar senha. Tente novamente."
            }
        }

        // 4. Marcar token como usado
        await supabaseAdmin
            .from("password_reset_tokens")
            .update({ used: true, used_at: new Date().toISOString() })
            .eq("token", token)

        return {
            success: true,
            message: "Senha redefinida com sucesso! Você já pode fazer login."
        }

    } catch (error) {
        console.error("Erro ao redefinir senha:", error)
        return {
            success: false,
            message: "Erro inesperado. Tente novamente."
        }
    }
}
