"use server"

import { getServiceSupabase } from "@/lib/supabase"
import crypto from "crypto"
import { Resend } from "resend"
import { firstAccessEmailTemplate } from "@/lib/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendFirstAccessEmail(userId: string, email: string, name: string) {
    try {
        console.log("📧 Iniciando envio de email para:", { userId, email, name })
        
        const supabase = getServiceSupabase()
        
        // Generate a secure token
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 48) // 48 hours to set password
        
        console.log("🔑 Token gerado, salvando no banco...")
        
        // Save token to database
        const { error: updateError } = await supabase
            .from("users_cards")
            .update({
                first_access_token: token,
                first_access_token_expires_at: expiresAt.toISOString()
            })
            .eq("id", userId)
        
        if (updateError) {
            console.error("❌ Erro ao salvar token:", updateError)
            return { success: false, error: "Erro ao gerar token de acesso" }
        }
        
        console.log("✅ Token salvo com sucesso")
        
        // Generate the link
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const accessLink = `${baseUrl}/primeiro-acesso/${token}`
        
        console.log("🔗 Link gerado:", accessLink)
        console.log("📮 Tentando enviar email via Resend...")
        console.log("🔧 Configurações:", {
            apiKey: process.env.RESEND_API_KEY ? "Configurada" : "❌ NÃO CONFIGURADA",
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: email
        })
        
        // Send email via Resend
        try {
            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                to: email,
                subject: '🎉 Carteirinha Aprovada - Defina sua Senha | MAF Card System',
                html: firstAccessEmailTemplate(name, accessLink, expiresAt)
            })
            
            if (error) {
                console.error("❌ Erro ao enviar email via Resend:", error)
                console.error("❌ Detalhes do erro:", JSON.stringify(error, null, 2))
                // Fallback: log the link for de`Erro ao enviar email: ${error.message || JSON.stringify(error)}` }
            }
            
            console.log("✅ Email enviado com sucesso via Resend! ID:", data?.id)
            return { success: true, link: accessLink }
            
        } catch (emailError: any) {
            console.error("❌ Exceção ao enviar email:", emailError)
            console.error("❌ Stack:", emailError?.stack
                `)
                return { success: false, error: "Erro ao enviar email. Verifique as configurações do Resend." }
            }
            
            console.log("Email enviado com sucesso via Resend:", data?.id)
            return { success: true, link: accessLink }
            
        } catch (emailError) {
            console.error("Excfalse, error: `Exceção ao enviar: ${emailError?.message || 'desconhecido'}` }
        }
        
    } catch (error: any) {
        console.error("❌ Erro geral ao enviar email:", error)
        console.error("❌ Stack:", error?.stack)
        return { success: false, error: `Erro ao enviar email: ${error?.message || 'Erro desconhecido'}`
            Link: ${accessLink}
            Expira em: ${expiresAt.toLocaleString('pt-BR')}
            ===========================================================
            `)
            return { success: true, link: accessLink } // Still return success for development
        }
        
    } catch (error) {
        console.error("Erro ao enviar email:", error)
        return { success: false, error: "Erro ao enviar email de primeiro acesso" }
    }
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
            .select("id, email")
            .eq("first_access_token", token)
            .single()
        
        if (fetchError || !user) {
            return { success: false, error: "Token inválido" }
        }
        
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
            return { success: false, error: "Erro ao criar conta: " + authError.message }
        }
        
        // Clear the first access token
        await supabase
            .from("users_cards")
            .update({
                first_access_token: null,
                first_access_token_expires_at: null,
                auth_user_id: authData.user.id
            })
            .eq("id", user.id)
        
        return { success: true }
    } catch (error) {
        return { success: false, error: "Erro ao processar solicitação" }
    }
}
