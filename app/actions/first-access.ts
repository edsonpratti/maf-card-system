"use server"

import { getServiceSupabase } from "@/lib/supabase"
import crypto from "crypto"
import { Resend } from "resend"
import { welcomeEmailTemplate } from "@/lib/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * NOVO FLUXO: Envia email de boas-vindas para TODOS os usuários que se cadastram
 * O usuário pode fazer login imediatamente após definir a senha
 * O MAF PRO ID só fica disponível após validação do certificado
 */
export async function sendWelcomeEmail(userId: string, email: string, name: string, status: string) {
    try {
        console.log("📧 [WELCOME] Iniciando envio de email para:", { userId, email, name, status })
        
        const supabase = getServiceSupabase()
        
        // Generate a secure token
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 72) // 72 hours to set password
        
        console.log("🔑 [WELCOME] Token gerado, salvando no banco...")
        
        // Save token to database
        const { error: updateError } = await supabase
            .from("users_cards")
            .update({
                first_access_token: token,
                first_access_token_expires_at: expiresAt.toISOString()
            })
            .eq("id", userId)
        
        if (updateError) {
            console.error("❌ [WELCOME] Erro ao salvar token:", updateError)
            return { success: false, error: "Erro ao gerar token de acesso" }
        }
        
        console.log("✅ [WELCOME] Token salvo com sucesso")
        
        // Generate the link
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const accessLink = `${baseUrl}/primeiro-acesso/${token}`
        
        console.log("🔗 [WELCOME] Link gerado:", accessLink)
        
        // Determinar se está aprovado ou pendente
        const isApproved = status === "AUTO_APROVADA"
        
        // Usar template apropriado
        const emailHtml = welcomeEmailTemplate(name, accessLink, expiresAt, isApproved)
        const subject = isApproved 
            ? '🎉 Bem-vinda ao MAF Pro! Sua carteirinha foi aprovada'
            : '🎉 Bem-vinda ao MAF Pro! Defina sua senha para acessar'
        
        // Send email via Resend
        try {
            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'mafpro@amandafernandes.com',
                to: email,
                subject: subject,
                html: emailHtml
            })
            
            if (error) {
                console.error("❌ [WELCOME] Erro ao enviar email via Resend:", error)
                return { success: false, error: `Erro ao enviar email: ${error.message || JSON.stringify(error)}` }
            }
            
            console.log("✅ [WELCOME] Email enviado com sucesso! ID:", data?.id)
            return { success: true, link: accessLink }
            
        } catch (emailError: any) {
            console.error("❌ [WELCOME] Exceção ao enviar email:", emailError)
            return { success: false, error: `Exceção ao enviar: ${emailError?.message || 'desconhecido'}` }
        }
        
    } catch (error: any) {
        console.error("❌ [WELCOME] Erro geral:", error)
        return { success: false, error: `Erro ao enviar email: ${error?.message || 'Erro desconhecido'}` }
    }
}

/**
 * Função usada quando admin aprova manualmente uma carteirinha
 * Envia email de notificação informando que foi aprovada
 */
export async function sendApprovalNotificationEmail(userId: string, email: string, name: string) {
    return sendWelcomeEmail(userId, email, name, "APROVADA_MANUAL")
}

export async function verifyFirstAccessToken(token: string) {
    try {
        const supabase = getServiceSupabase()
        
        const { data: user, error } = await supabase
            .from("users_cards")
            .select("id, email, name, first_access_token, first_access_token_expires_at")
            .eq("first_access_token", token)
            .single()
        
        if (error || !user) {
            return { valid: false, error: "Token não encontrado" }
        }
        
        // Check if token is expired
        if (user.first_access_token_expires_at) {
            const expiresAt = new Date(user.first_access_token_expires_at)
            if (expiresAt < new Date()) {
                return { valid: false, error: "Token expirado" }
            }
        }
        
        return {
            valid: true,
            email: user.email,
            name: user.name,
            userId: user.id
        }
    } catch (error) {
        return { valid: false, error: "Erro ao verificar token" }
    }
}

export async function setUserPassword(token: string, password: string) {
    try {
        const supabase = getServiceSupabase()
        
        // First verify the token and get the user
        const { data: user, error: fetchError } = await supabase
            .from("users_cards")
            .select("id, email, auth_user_id")
            .eq("first_access_token", token)
            .single()
        
        if (fetchError || !user) {
            return { success: false, error: "Token inválido" }
        }
        
        let authUserId = user.auth_user_id
        
        // Se já tem auth_user_id, apenas atualiza a senha
        if (authUserId) {
            const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
                authUserId,
                { password: password }
            )
            
            if (updateAuthError) {
                console.error("Erro ao atualizar senha:", updateAuthError)
                return { success: false, error: "Erro ao definir senha: " + updateAuthError.message }
            }
        } else {
            // Create auth user with the password
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    card_id: user.id
                }
            })
            
            if (authError) {
                console.error("Erro ao criar usuário auth:", authError)
                return { success: false, error: "Erro ao criar conta: " + authError.message }
            }
            
            authUserId = authData.user.id
        }
        
        // Clear the first access token and mark as completed
        const { error: updateError } = await supabase
            .from("users_cards")
            .update({
                first_access_token: null,
                first_access_token_expires_at: null,
                auth_user_id: authUserId,
                first_access_completed_at: new Date().toISOString(),
                is_active: true
            })
            .eq("id", user.id)
        
        if (updateError) {
            console.error("Erro ao atualizar users_cards:", updateError)
            // Não retorna erro pois a senha foi definida com sucesso
        }
        
        console.log("✅ Senha definida com sucesso para:", user.email)
        return { success: true }
    } catch (error: any) {
        console.error("Erro ao definir senha:", error)
        return { success: false, error: "Erro ao processar solicitação" }
    }
}
