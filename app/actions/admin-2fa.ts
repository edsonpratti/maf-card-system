"use server"

import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { admin2FACodeEmailTemplate } from "@/lib/email-templates-admin"

// Cliente Supabase com permissões de service_role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Gera um código de 6 dígitos aleatório
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Gera e envia um código 2FA para o email do administrador
 */
export async function generateAndSend2FACode(email: string, userId?: string) {
  try {
    console.log("🔐 [2FA] Gerando código para:", email)

    // 1. Verificar se o usuário é admin
    // Usa getUserById (direto, sem paginação) se userId fornecido; fallback por email
    let user: any

    if (userId) {
      const { data, error } = await supabase.auth.admin.getUserById(userId)
      if (error || !data?.user) {
        console.error("❌ [2FA] Erro ao buscar usuário por ID:", error)
        return { success: false, message: "Usuário não encontrado" }
      }
      user = data.user
    } else {
      // Fallback: busca por email com paginação generosa
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      if (authError) {
        console.error("❌ [2FA] Erro ao buscar usuários:", authError)
        return { success: false, message: "Erro ao verificar usuário" }
      }
      user = authUser.users.find(u => u.email === email)
      if (!user) {
        console.log("❌ [2FA] Usuário não encontrado:", email)
        return { success: false, message: "Usuário não encontrado" }
      }
    }

    const isAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
    
    if (!isAdmin) {
      console.log("❌ [2FA] Usuário não é admin:", email)
      return {
        success: false,
        message: "Acesso negado"
      }
    }

    // 2. Gerar código
    const code = generateCode()
    console.log("✅ [2FA] Código gerado:", code)

    // 3. Salvar no banco de dados
    const { error: insertError } = await supabase
      .from("admin_2fa_codes")
      .insert({
        email,
        code,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
        used: false
      })

    if (insertError) {
      console.error("❌ [2FA] Erro ao salvar código:", insertError)
      return {
        success: false,
        message: "Erro ao gerar código de acesso"
      }
    }

    console.log("✅ [2FA] Código salvo no banco")

    // 4. Enviar email
    const userName = user.user_metadata?.name || user.email?.split("@")[0] || "Admin"
    const htmlContent = admin2FACodeEmailTemplate(userName, code)

    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com",
        to: email,
        subject: "🔐 Código de Acesso - MAF Card System",
        html: htmlContent,
      })

      if (emailError) {
        console.error("❌ [2FA] Erro ao enviar email:", emailError)
        return {
          success: false,
          message: "Erro ao enviar código por email"
        }
      }

      console.log("✅ [2FA] Email enviado com sucesso:", emailData)

      return {
        success: true,
        message: "Código enviado para seu email. Verifique sua caixa de entrada.",
        email
      }
    } catch (emailError) {
      console.error("❌ [2FA] Erro ao enviar email:", emailError)
      return {
        success: false,
        message: "Erro ao enviar código por email"
      }
    }
  } catch (error) {
    console.error("❌ [2FA] Erro geral:", error)
    return {
      success: false,
      message: "Erro inesperado ao processar solicitação"
    }
  }
}

/**
 * Valida um código 2FA (versão simples)
 */
export async function validate2FACode(email: string, code: string) {
  try {
    console.log("🔐 [2FA] Validando código para:", email)

    // 1. Buscar código no banco
    const { data: codes, error: fetchError } = await supabase
      .from("admin_2fa_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error("❌ [2FA] Erro ao buscar código:", fetchError)
      return {
        success: false,
        message: "Erro ao validar código"
      }
    }

    if (!codes || codes.length === 0) {
      console.log("❌ [2FA] Código não encontrado ou já usado")
      return {
        success: false,
        message: "Código inválido ou já utilizado"
      }
    }

    const codeData = codes[0]

    // 2. Verificar expiração
    const expiresAt = new Date(codeData.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      console.log("❌ [2FA] Código expirado")
      return {
        success: false,
        message: "Código expirado. Solicite um novo código."
      }
    }

    // 3. Marcar código como usado
    const { error: updateError } = await supabase
      .from("admin_2fa_codes")
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq("id", codeData.id)

    if (updateError) {
      console.error("❌ [2FA] Erro ao marcar código como usado:", updateError)
      return {
        success: false,
        message: "Erro ao processar código"
      }
    }

    console.log("✅ [2FA] Código validado com sucesso")

    return {
      success: true,
      message: "Código validado com sucesso",
      email
    }
  } catch (error) {
    console.error("❌ [2FA] Erro geral:", error)
    return {
      success: false,
      message: "Erro inesperado ao validar código"
    }
  }
}

/**
 * Valida um código 2FA e retorna as credenciais para login
 */
export async function validate2FACodeAndLogin(email: string, code: string, password: string) {
  try {
    console.log("🔐 [2FA] Validando código e fazendo login para:", email)

    // 1. Buscar código no banco
    const { data: codes, error: fetchError } = await supabase
      .from("admin_2fa_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error("❌ [2FA] Erro ao buscar código:", fetchError)
      return {
        success: false,
        message: "Erro ao validar código"
      }
    }

    if (!codes || codes.length === 0) {
      console.log("❌ [2FA] Código não encontrado ou já usado")
      return {
        success: false,
        message: "Código inválido ou já utilizado"
      }
    }

    const codeData = codes[0]

    // 2. Verificar expiração
    const expiresAt = new Date(codeData.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      console.log("❌ [2FA] Código expirado")
      return {
        success: false,
        message: "Código expirado. Solicite um novo código."
      }
    }

    // 3. Marcar código como usado
    const { error: updateError } = await supabase
      .from("admin_2fa_codes")
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq("id", codeData.id)

    if (updateError) {
      console.error("❌ [2FA] Erro ao marcar código como usado:", updateError)
      return {
        success: false,
        message: "Erro ao processar código"
      }
    }

    console.log("✅ [2FA] Código validado com sucesso")

    // 4. Retornar sucesso (o login será feito no cliente)
    return {
      success: true,
      message: "Código validado com sucesso",
      email,
      shouldLogin: true
    }
  } catch (error) {
    console.error("❌ [2FA] Erro geral:", error)
    return {
      success: false,
      message: "Erro inesperado ao validar código"
    }
  }
}

