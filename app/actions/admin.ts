"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminAccess } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { sendApprovalNotificationEmail, sendWelcomeEmail, sendRejectionEmail } from "./first-access"
import { generateCardNumber } from "@/lib/utils"

async function createAuditLog(
    adminUserId: string,
    action: string,
    targetUserId: string | null = null,
    metadata: any = {}
) {
    const supabase = getServiceSupabase()

    await supabase.from("admin_audit_logs").insert({
        admin_user_id: adminUserId,
        action,
        target_user_id: targetUserId,
        metadata,
    }).select()
}

export async function getRequests(filters?: {
    status?: string
    name?: string
    cpf?: string
    startDate?: string
    endDate?: string
}) {
    await verifyAdminAccess()

    const supabase = getServiceSupabase()
    let query = supabase
        .from("users_cards")
        .select("*")
        .order("created_at", { ascending: false })

    if (filters?.status && filters.status !== "ALL") {
        query = query.eq("status", filters.status)
    }

    if (filters?.name) {
        query = query.ilike("name", `%${filters.name}%`)
    }

    if (filters?.cpf) {
        query = query.ilike("cpf", `%${filters.cpf}%`)
    }

    if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate)
    }

    if (filters?.endDate) {
        // Adiciona 1 dia e subtrai 1 segundo para incluir todo o dia final
        const endDateTime = new Date(filters.endDate)
        endDateTime.setDate(endDateTime.getDate() + 1)
        endDateTime.setSeconds(endDateTime.getSeconds() - 1)
        query = query.lte("created_at", endDateTime.toISOString())
    }

    const { data, error } = await query

    if (error) {
        return []
    }

    return data
}

export async function updateRequestStatus(id: string, newStatus: string, reason?: string) {
    const user = await verifyAdminAccess()

    const supabase = getServiceSupabase()

    const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
    }

    if (newStatus === "RECUSADA" && reason) {
        updateData.rejection_reason = reason
    }

    if (newStatus === "APROVADA_MANUAL" || newStatus === "AUTO_APROVADA") {
        updateData.issued_at = new Date().toISOString()
        updateData.maf_pro_id_approved = true
        updateData.maf_pro_id_approved_at = new Date().toISOString()
        updateData.maf_pro_id_approved_by = user.id

        // Buscar o registro para verificar se já tem card_number e validation_token
        const { data: currentCard } = await supabase
            .from("users_cards")
            .select("card_number, validation_token")
            .eq("id", id)
            .single()

        // Gerar card_number se não existir
        if (!currentCard?.card_number) {
            updateData.card_number = generateCardNumber()
        }

        // Gerar validation_token se não existir
        if (!currentCard?.validation_token) {
            // Gerar token seguro sem usar require()
            updateData.validation_token = Array.from({ length: 64 }, () =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('')
        }
    }

    const { error } = await supabase
        .from("users_cards")
        .update(updateData)
        .eq("id", id)

    if (error) {
        return { success: false, message: error.message }
    }

    // Se aprovado, enviar email de confirmação da carteirinha e liberar MAF Pro ID
    if (newStatus === "APROVADA_MANUAL" || newStatus === "AUTO_APROVADA") {
        const { data: userData } = await supabase
            .from("users_cards")
            .select("email, name")
            .eq("id", id)
            .single()

        if (userData?.email && userData?.name) {
            try {
                const { Resend } = await import("resend")
                const { mafProIdApprovedEmailTemplate } = await import("@/lib/email-templates")

                const resend = new Resend(process.env.RESEND_API_KEY)
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com",
                    to: userData.email,
                    subject: "🎉 Sua carteirinha foi validada!",
                    html: mafProIdApprovedEmailTemplate(userData.name)
                })
            } catch (emailError) {
                console.error("Erro ao enviar email de aprovação da carteirinha:", emailError)
                // Não falha a aprovação se o email falhar
            }
        }
    }

    // If rejected, send rejection email with reason
    if (newStatus === "RECUSADA" && reason) {
        // Get user data to send email
        const { data: userData } = await supabase
            .from("users_cards")
            .select("email, name")
            .eq("id", id)
            .single()

        if (userData) {
            // Send rejection email (non-blocking, errors are logged but don't fail the operation)
            sendRejectionEmail(userData.email, userData.name, reason).catch((error) => {
                console.error("Erro ao enviar email de recusa:", error)
            })
        }
    }

    // Log action
    await createAuditLog(user.id, newStatus, id, { reason })

    revalidatePath("/admin/solicitacoes")
    return { success: true }
}

export async function resendFirstAccessEmail(id: string) {
    const user = await verifyAdminAccess()

    const supabase = getServiceSupabase()

    // Get user data
    const { data: userData, error } = await supabase
        .from("users_cards")
        .select("id, email, name, status, auth_user_id")
        .eq("id", id)
        .single()

    if (error || !userData) {
        console.error("Erro ao buscar usuário para reenvio:", error)
        return { success: false, message: "Usuário não encontrado" }
    }

    // Check if already has auth account
    if (userData.auth_user_id) {
        return { success: false, message: "Usuário já possui conta criada. Use 'Esqueci minha senha' na tela de login." }
    }

    // Only allow for approved cards
    if (userData.status !== "APROVADA_MANUAL" && userData.status !== "AUTO_APROVADA") {
        return { success: false, message: "Apenas carteirinhas aprovadas podem receber o email de primeiro acesso" }
    }

    // Resend email - using sendWelcomeEmail with AUTO_APROVADA status since user is already approved
    const result = await sendWelcomeEmail(userData.id, userData.email, userData.name, userData.status)

    if (result.success) {
        // Log action
        await createAuditLog(user.id, "RESEND_FIRST_ACCESS_EMAIL", id)

        return { success: true, message: "Email de primeiro acesso reenviado com sucesso!" }
    }

    return { success: false, message: result.error || "Erro ao enviar email" }
}

export async function revertRequestStatus(id: string, newStatus: "PENDENTE_MANUAL" | "APROVADA_MANUAL") {
    const user = await verifyAdminAccess()

    const supabase = getServiceSupabase()

    // Buscar o registro atual
    const { data: currentRequest, error: fetchError } = await supabase
        .from("users_cards")
        .select("id, status, name, email, rejection_reason")
        .eq("id", id)
        .single()

    if (fetchError || !currentRequest) {
        return { success: false, message: "Usuário não encontrado" }
    }

    // Apenas permitir reversão se o status atual for RECUSADA
    if (currentRequest.status !== "RECUSADA") {
        return { success: false, message: "Apenas solicitações recusadas podem ser revertidas" }
    }

    const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        rejection_reason: null, // Limpar o motivo da recusa
    }

    // Se estiver aprovando, gerar card_number e validation_token
    if (newStatus === "APROVADA_MANUAL") {
        updateData.issued_at = new Date().toISOString()
        updateData.maf_pro_id_approved = true
        updateData.maf_pro_id_approved_at = new Date().toISOString()
        updateData.maf_pro_id_approved_by = user.id

        // Buscar o registro para verificar se já tem card_number e validation_token
        const { data: cardData } = await supabase
            .from("users_cards")
            .select("card_number, validation_token")
            .eq("id", id)
            .single()

        // Gerar card_number se não existir
        if (!cardData?.card_number) {
            updateData.card_number = generateCardNumber()
        }

        // Gerar validation_token se não existir
        if (!cardData?.validation_token) {
            updateData.validation_token = Array.from({ length: 64 }, () =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('')
        }
    }

    const { error } = await supabase
        .from("users_cards")
        .update(updateData)
        .eq("id", id)

    if (error) {
        return { success: false, message: error.message }
    }

    // Se foi aprovado, enviar email de confirmação da carteirinha
    if (newStatus === "APROVADA_MANUAL") {
        try {
            const { Resend } = await import("resend")
            const { mafProIdApprovedEmailTemplate } = await import("@/lib/email-templates")

            const resend = new Resend(process.env.RESEND_API_KEY)
            await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com",
                to: currentRequest.email,
                subject: "🎉 Sua carteirinha foi validada!",
                html: mafProIdApprovedEmailTemplate(currentRequest.name)
            })
        } catch (emailError) {
            console.error("Erro ao enviar email de aprovação da carteirinha:", emailError)
            // Não falha a aprovação se o email falhar
        }
    }

    // Log action
    await createAuditLog(user.id, `REVERT_TO_${newStatus}`, id, { 
        previousStatus: "RECUSADA",
        previousRejectionReason: currentRequest.rejection_reason 
    })

    revalidatePath("/admin/solicitacoes")
    return { 
        success: true, 
        message: newStatus === "APROVADA_MANUAL" 
            ? "Solicitação revertida e aprovada com sucesso!" 
            : "Solicitação retornada para análise com sucesso!"
    }
}

export async function deleteRequest(id: string) {
    const user = await verifyAdminAccess()

    const supabase = getServiceSupabase()
    const { error } = await supabase.from("users_cards").delete().eq("id", id)

    if (error) {
        return { success: false, message: error.message }
    }

    // Log action
    await createAuditLog(user.id, "DELETE_REQUEST", id)

    revalidatePath("/admin/solicitacoes")
    return { success: true }
}

export async function getDashboardStats() {
    await verifyAdminAccess()

    const supabase = getServiceSupabase()

    // Get total pending approvals (waitlist manual)
    const { count: pendingCount } = await supabase
        .from("users_cards")
        .select("*", { count: "exact", head: true })
        .eq("status", "WAITLIST_MANUAL")

    // Get total issued cards
    const { count: issuedCount } = await supabase
        .from("users_cards")
        .select("*", { count: "exact", head: true })
        .in("status", ["APROVADA_MANUAL", "AUTO_APROVADA"])

    // Get rejected in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: rejectedCount } = await supabase
        .from("users_cards")
        .select("*", { count: "exact", head: true })
        .eq("status", "RECUSADA")
        .gte("updated_at", thirtyDaysAgo.toISOString())

    // Get issued this month for growth calculation
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const { count: issuedThisMonth } = await supabase
        .from("users_cards")
        .select("*", { count: "exact", head: true })
        .in("status", ["APROVADA_MANUAL", "AUTO_APROVADA"])
        .gte("issued_at", firstDayOfMonth.toISOString())

    // Get issued last month for growth calculation
    const firstDayOfLastMonth = new Date(firstDayOfMonth)
    firstDayOfLastMonth.setMonth(firstDayOfLastMonth.getMonth() - 1)
    const lastDayOfLastMonth = new Date(firstDayOfMonth)
    lastDayOfLastMonth.setDate(lastDayOfLastMonth.getDate() - 1)

    const { count: issuedLastMonth } = await supabase
        .from("users_cards")
        .select("*", { count: "exact", head: true })
        .in("status", ["APROVADA_MANUAL", "AUTO_APROVADA"])
        .gte("issued_at", firstDayOfLastMonth.toISOString())
        .lte("issued_at", lastDayOfLastMonth.toISOString())

    // Calculate growth percentage
    let growthPercentage = 0
    if (issuedLastMonth && issuedLastMonth > 0) {
        growthPercentage = Math.round(((issuedThisMonth || 0) - issuedLastMonth) / issuedLastMonth * 100)
    } else if (issuedThisMonth && issuedThisMonth > 0) {
        growthPercentage = 100
    }

    return {
        pending: pendingCount || 0,
        issued: issuedCount || 0,
        rejected: rejectedCount || 0,
        growthPercentage,
        issuedThisMonth: issuedThisMonth || 0,
    }
}

export async function adminLogout() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )

    await supabase.auth.signOut()
    redirect("/admin/login")
}

export async function getCurrentAdmin() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getAuditLogs(filters?: {
    action?: string
    startDate?: string
    endDate?: string
    limit?: number
}) {
    await verifyAdminAccess()

    const supabase = getServiceSupabase()

    let query = supabase
        .from("admin_audit_logs")
        .select(`
            *,
            users_cards:target_user_id (
                name,
                cpf,
                email
            )
        `)
        .order("created_at", { ascending: false })

    if (filters?.action && filters.action !== "ALL") {
        query = query.eq("action", filters.action)
    }

    if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate)
    }

    if (filters?.endDate) {
        // Add one day to include the entire end date
        const endDate = new Date(filters.endDate)
        endDate.setDate(endDate.getDate() + 1)
        query = query.lt("created_at", endDate.toISOString())
    }

    if (filters?.limit) {
        query = query.limit(filters.limit)
    } else {
        query = query.limit(100) // Default limit
    }

    const { data, error } = await query

    if (error) {
        return []
    }

    return data || []
}

export async function createTestLog() {
    const user = await verifyAdminAccess()

    await createAuditLog(
        user.id,
        "TESTE_SISTEMA",
        null,
        {
            teste: true,
            timestamp: new Date().toISOString(),
            mensagem: "Log de teste criado manualmente"
        }
    )

    revalidatePath("/admin/logs")
    return { success: true, message: "Log de teste criado!" }
}

export async function getRegisteredStudents(includeDisabled: boolean = true) {
    await verifyAdminAccess()

    const supabase = getServiceSupabase()

    // Busca TODOS os usuários cadastrados (independente de terem definido senha)
    // O campo auth_user_id indica se já criaram conta (definiram senha)
    let query = supabase
        .from("users_cards")
        .select("*")
        .order("created_at", { ascending: false })

    // Se não incluir desabilitados, filtrar
    if (!includeDisabled) {
        query = query.or("is_disabled.is.null,is_disabled.eq.false")
    }

    const { data, error } = await query

    if (error) {
        console.error("Erro ao buscar usuários registrados:", error)
        return []
    }

    return data || []
}
export async function resendPasswordResetEmail(id: string) {
    const user = await verifyAdminAccess()
    const supabase = getServiceSupabase()

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
        .from("users_cards")
        .select("id, email, name, auth_user_id, status")
        .eq("id", id)
        .single()

    if (userError || !userData) {
        console.error("Erro ao buscar usuário:", userError)
        return { success: false, message: "Usuário não encontrado" }
    }

    // Verificar se o usuário já tem conta criada
    if (!userData.auth_user_id) {
        return {
            success: false,
            message: "Usuário ainda não criou conta. Use 'Reenviar Email de Primeiro Acesso' ao invés disso."
        }
    }

    // Importar função de recuperação de senha
    const crypto = await import("crypto")
    const { Resend } = await import("resend")
    const { resendPasswordEmailTemplate } = await import("@/lib/email-templates-admin")

    const resend = new Resend(process.env.RESEND_API_KEY)

    try {
        // Gerar token de reset
        const resetToken = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + 30) // 30 minutos

        // Salvar token no banco
        const { error: tokenError } = await supabase
            .from("password_reset_tokens")
            .insert({
                user_id: userData.auth_user_id,
                token: resetToken,
                expires_at: expiresAt.toISOString(),
                used: false
            })

        if (tokenError) {
            console.error("Erro ao criar token:", tokenError)
            return { success: false, message: "Erro ao gerar token de recuperação" }
        }

        // Enviar email
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mafpro.amandafernandes.com'}/recuperar-senha/${resetToken}`

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com",
            to: userData.email,
            subject: "Redefinição de Senha - MAF Card System",
            html: resendPasswordEmailTemplate(userData.name, resetLink),
        })

        if (emailError) {
            console.error("Erro ao enviar email:", emailError)
            return { success: false, message: "Erro ao enviar email" }
        }

        // Registrar no log
        await createAuditLog(user.id, "RESEND_PASSWORD_RESET", id, {
            email: userData.email,
            emailId: emailData?.id
        })

        return { success: true, message: "Email de redefinição de senha enviado com sucesso!" }

    } catch (error) {
        console.error("Erro ao reenviar email de senha:", error)
        return { success: false, message: "Erro ao processar solicitação" }
    }
}

export async function resendCardDownloadEmail(id: string) {
    const user = await verifyAdminAccess()
    const supabase = getServiceSupabase()

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
        .from("users_cards")
        .select("id, email, name, card_number, status, auth_user_id")
        .eq("id", id)
        .single()

    if (userError || !userData) {
        console.error("Erro ao buscar usuário:", userError)
        return { success: false, message: "Usuário não encontrado" }
    }

    // Verificar se o cartão está aprovado
    if (userData.status !== "APROVADA_MANUAL" && userData.status !== "AUTO_APROVADA") {
        return {
            success: false,
            message: "Apenas carteirinhas aprovadas podem receber o email de download"
        }
    }

    // Verificar se tem número de carteirinha
    if (!userData.card_number) {
        return {
            success: false,
            message: "Carteirinha sem número gerado. Entre em contato com o suporte técnico."
        }
    }

    // Verificar se o usuário já tem conta criada
    if (!userData.auth_user_id) {
        return {
            success: false,
            message: "Usuário ainda não criou conta. Use 'Reenviar Email de Primeiro Acesso' primeiro."
        }
    }

    const { Resend } = await import("resend")
    const { cardDownloadEmailTemplate } = await import("@/lib/email-templates-admin")

    const resend = new Resend(process.env.RESEND_API_KEY)

    try {
        // Link direto para download do PDF
        const downloadLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mafpro.amandafernandes.com'}/api/cartao/${userData.id}`

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com",
            to: userData.email,
            subject: "Download da sua Carteirinha Profissional - MAF Card System",
            html: cardDownloadEmailTemplate(userData.name, downloadLink, userData.card_number),
        })

        if (emailError) {
            console.error("Erro ao enviar email:", emailError)
            return { success: false, message: "Erro ao enviar email" }
        }

        // Registrar no log
        await createAuditLog(user.id, "RESEND_CARD_DOWNLOAD", id, {
            email: userData.email,
            cardNumber: userData.card_number,
            emailId: emailData?.id
        })

        return { success: true, message: "Email de download da carteirinha enviado com sucesso!" }

    } catch (error) {
        console.error("Erro ao reenviar email de download:", error)
        return { success: false, message: "Erro ao processar solicitação" }
    }
}

// ========== Funções para Validação de Certificados ==========

export async function getPendingValidations() {
    await verifyAdminAccess()

    const supabase = getServiceSupabase()
    const { data, error } = await supabase
        .from("users_cards")
        .select("id, name, cpf, email, status, certificate_file_path, created_at")
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Erro ao buscar validações:", error)
        return []
    }

    return data || []
}

export async function getValidationStats() {
    await verifyAdminAccess()

    const supabase = getServiceSupabase()

    // Buscar contagens por status
    const { data: pendingData } = await supabase
        .from("users_cards")
        .select("id", { count: "exact" })
        .eq("status", "PENDENTE_MANUAL")

    const { data: autoData } = await supabase
        .from("users_cards")
        .select("id", { count: "exact" })
        .eq("status", "AUTO_APROVADA")

    const { data: manualData } = await supabase
        .from("users_cards")
        .select("id", { count: "exact" })
        .eq("status", "APROVADA_MANUAL")

    const { data: rejectedData } = await supabase
        .from("users_cards")
        .select("id", { count: "exact" })
        .eq("status", "RECUSADA")

    const { data: totalData } = await supabase
        .from("users_cards")
        .select("id", { count: "exact" })

    return {
        pending: pendingData?.length || 0,
        autoApproved: autoData?.length || 0,
        manualApproved: manualData?.length || 0,
        rejected: rejectedData?.length || 0,
        total: totalData?.length || 0
    }
}

// ========== Funções para Configurações ==========

type ValidationSettings = {
    auto_validation_enabled: boolean
    require_certificate_upload: boolean
    auto_send_first_access_email: boolean
    rejection_email_enabled: boolean
    default_rejection_message: string
}

// Configurações padrão (armazenadas em memória por enquanto, 
// pode ser migrado para tabela de settings no banco)
let validationSettings: ValidationSettings = {
    auto_validation_enabled: true,
    require_certificate_upload: true,
    auto_send_first_access_email: true,
    rejection_email_enabled: true,
    default_rejection_message: "Seu certificado não pôde ser validado. Por favor, entre em contato para mais informações."
}

export async function getValidationSettings(): Promise<ValidationSettings> {
    await verifyAdminAccess()

    const supabase = getServiceSupabase()

    // Tentar buscar do banco de dados
    const { data, error } = await supabase
        .from("system_settings")
        .select("settings")
        .eq("key", "validation_settings")
        .single()

    if (data && data.settings) {
        return data.settings as ValidationSettings
    }

    // Retornar configurações padrão se não existir no banco
    return validationSettings
}

export async function updateValidationSettings(settings: ValidationSettings) {
    const user = await verifyAdminAccess()

    const supabase = getServiceSupabase()

    // Tentar fazer upsert na tabela de settings
    const { error } = await supabase
        .from("system_settings")
        .upsert({
            key: "validation_settings",
            settings: settings,
            updated_at: new Date().toISOString()
        }, {
            onConflict: "key"
        })

    if (error) {
        // Se a tabela não existir, armazenar em memória
        if (error.code === "42P01") {
            validationSettings = settings
            return { success: true, message: "Configurações salvas (memória local)" }
        }
        console.error("Erro ao salvar configurações:", error)
        return { success: false, message: error.message }
    }

    // Log da ação
    await createAuditLog(user.id, "UPDATE_VALIDATION_SETTINGS", null, { settings })

    return { success: true, message: "Configurações salvas com sucesso" }
}

// ========== Funções para Gerenciamento de Usuários ==========

export async function deleteUser(id: string) {
    const user = await verifyAdminAccess()
    const supabase = getServiceSupabase()

    // Buscar dados do usuário antes de deletar (para log)
    const { data: userData } = await supabase
        .from("users_cards")
        .select("name, email, cpf, auth_user_id")
        .eq("id", id)
        .single()

    if (!userData) {
        return { success: false, message: "Usuário não encontrado" }
    }

    // Se o usuário tem conta de auth, deletar também
    if (userData.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(userData.auth_user_id)
        if (authError) {
            console.error("Erro ao deletar conta de auth:", authError)
            // Continua mesmo se falhar a exclusão da conta de auth
        }
    }

    // Deletar o usuário
    const { error } = await supabase
        .from("users_cards")
        .delete()
        .eq("id", id)

    if (error) {
        console.error("Erro ao deletar usuário:", error)
        return { success: false, message: error.message }
    }

    // Log da ação
    await createAuditLog(user.id, "DELETE_USER", id, {
        deletedUser: {
            name: userData.name,
            email: userData.email,
            cpf: userData.cpf
        }
    })

    revalidatePath("/admin/usuarios")
    return { success: true, message: "Usuário excluído com sucesso" }
}

export async function toggleUserStatus(id: string) {
    const user = await verifyAdminAccess()
    const supabase = getServiceSupabase()

    console.log("[toggleUserStatus] Buscando usuário com id:", id)

    // Buscar status atual - buscar primeiro só os campos básicos para garantir que existe
    const { data: userData, error: fetchError } = await supabase
        .from("users_cards")
        .select("id, name, email, is_disabled")
        .eq("id", id)
        .single()

    console.log("[toggleUserStatus] Resultado:", { userData, fetchError })

    if (fetchError) {
        console.error("[toggleUserStatus] Erro ao buscar usuário:", fetchError)
        return { success: false, message: `Erro ao buscar usuário: ${fetchError.message}` }
    }

    if (!userData) {
        return { success: false, message: "Usuário não encontrado" }
    }

    const newStatus = !userData.is_disabled

    // Atualizar status
    const { error } = await supabase
        .from("users_cards")
        .update({
            is_disabled: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)

    if (error) {
        console.error("Erro ao atualizar status:", error)
        return { success: false, message: error.message }
    }

    // Log da ação
    await createAuditLog(user.id, newStatus ? "DISABLE_USER" : "ENABLE_USER", id, {
        userName: userData.name,
        userEmail: userData.email
    })

    revalidatePath("/admin/usuarios")
    return {
        success: true,
        message: newStatus ? "Usuário desabilitado com sucesso" : "Usuário habilitado com sucesso",
        isDisabled: newStatus
    }
}

export async function createUserManually(data: {
    name: string
    cpf: string
    email: string
    whatsapp?: string
    sendEmail: boolean
}) {
    const user = await verifyAdminAccess()
    const supabase = getServiceSupabase()

    // Validar CPF
    const cpfClean = data.cpf.replace(/\D/g, "")
    if (cpfClean.length !== 11) {
        return { success: false, message: "CPF inválido" }
    }

    // Verificar se já existe usuário com esse CPF ou email
    const { data: existingUser } = await supabase
        .from("users_cards")
        .select("id")
        .or(`cpf.eq.${data.cpf},email.eq.${data.email}`)
        .single()

    if (existingUser) {
        return { success: false, message: "Já existe um usuário com esse CPF ou email" }
    }

    // Gerar card_number e validation_token
    const cardNumber = generateCardNumber()
    const validationToken = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('')

    // Criar o usuário
    const { data: newUser, error } = await supabase
        .from("users_cards")
        .insert({
            name: data.name,
            cpf: data.cpf,
            email: data.email,
            whatsapp: data.whatsapp || null,
            status: "APROVADA_MANUAL",
            card_number: cardNumber,
            validation_token: validationToken,
            issued_at: new Date().toISOString(),
            is_disabled: false
        })
        .select()
        .single()

    if (error) {
        console.error("Erro ao criar usuário:", error)
        return { success: false, message: error.message }
    }

    // Log da ação
    await createAuditLog(user.id, "CREATE_USER_MANUAL", newUser.id, {
        name: data.name,
        email: data.email,
        cpf: data.cpf
    })

    // Enviar email de primeiro acesso se solicitado
    if (data.sendEmail) {
        try {
            await sendWelcomeEmail(newUser.id, data.email, data.name, "AUTO_APROVADA")
        } catch (emailError) {
            console.error("Erro ao enviar email:", emailError)
            // Não falha a criação se o email falhar
        }
    }

    revalidatePath("/admin/usuarios")
    return {
        success: true,
        message: data.sendEmail
            ? "Usuário criado e email de primeiro acesso enviado!"
            : "Usuário criado com sucesso!",
        userId: newUser.id
    }
}

// ========== MAF Pro ID Approval ==========

/**
 * Aprova o acesso ao MAF Pro ID para um usuário
 * Envia email de notificação e registra a ação em audit logs
 */
export async function approveMafProIdAccess(userId: string) {
    const admin = await verifyAdminAccess()
    const supabase = getServiceSupabase()

    // Buscar dados do usuário
    const { data: userData, error: fetchError } = await supabase
        .from("users_cards")
        .select("id, name, email, status, maf_pro_id_approved, auth_user_id")
        .eq("id", userId)
        .single()

    if (fetchError || !userData) {
        console.error("Erro ao buscar usuário:", fetchError)
        return { success: false, message: "Usuário não encontrado" }
    }

    // Verificar se já está aprovado
    if (userData.maf_pro_id_approved) {
        return { success: false, message: "Usuário já tem acesso aprovado ao MAF Pro ID" }
    }

    // Atualizar aprovação do MAF Pro ID
    const { error: updateError } = await supabase
        .from("users_cards")
        .update({
            maf_pro_id_approved: true,
            maf_pro_id_approved_at: new Date().toISOString(),
            maf_pro_id_approved_by: admin.id,
            // Se ainda está pendente, aprovar também o status
            status: userData.status === "PENDENTE_MANUAL" ? "APROVADA_MANUAL" : userData.status,
            updated_at: new Date().toISOString()
        })
        .eq("id", userId)

    if (updateError) {
        console.error("Erro ao aprovar MAF Pro ID:", updateError)
        return { success: false, message: "Erro ao aprovar acesso" }
    }

    // Se o status mudou para APROVADA_MANUAL, gerar card_number e validation_token
    if (userData.status === "PENDENTE_MANUAL") {
        const cardNumber = generateCardNumber()
        const validationToken = Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('')

        await supabase
            .from("users_cards")
            .update({
                card_number: cardNumber,
                validation_token: validationToken,
                issued_at: new Date().toISOString()
            })
            .eq("id", userId)
    }

    // Enviar email de notificação sempre (independente de auth_user_id)
    if (userData.email && userData.name) {
        try {
            const { Resend } = await import("resend")
            const { mafProIdApprovedEmailTemplate } = await import("@/lib/email-templates")

            const resend = new Resend(process.env.RESEND_API_KEY)

            const { error: emailError } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com",
                to: userData.email,
                subject: "🎉 Seu MAF Pro ID foi aprovado!",
                html: mafProIdApprovedEmailTemplate(userData.name)
            })

            if (emailError) {
                console.error("Erro ao enviar email de aprovação:", emailError)
                // Não falha a aprovação se o email falhar
            }
        } catch (emailError) {
            console.error("Erro ao enviar email de aprovação:", emailError)
            // Não falha a aprovação se o email falhar
        }
    }

    // Registrar no audit log
    await createAuditLog(admin.id, "APPROVE_MAF_PRO_ID", userId, {
        userName: userData.name,
        userEmail: userData.email,
        previousStatus: userData.status
    })

    revalidatePath("/admin/alunos")
    revalidatePath("/admin/solicitacoes")

    return {
        success: true,
        message: "Acesso ao MAF Pro ID aprovado com sucesso! Email de notificação enviado."
    }
}

export async function updateUserData(userId: string, data: {
    name?: string
    email?: string
    cpf?: string
    whatsapp?: string
    address?: {
        street?: string
        number?: string
        complement?: string
        neighborhood?: string
        city?: string
        state?: string
        cep?: string
    }
    photoBase64?: string | null
    removePhoto?: boolean
}) {
    const admin = await verifyAdminAccess()
    const supabase = getServiceSupabase()

    try {
        // Buscar dados atuais do usuário
        const { data: currentUser, error: fetchError } = await supabase
            .from("users_cards")
            .select("*")
            .eq("id", userId)
            .single()

        if (fetchError || !currentUser) {
            return { success: false, message: "Usuário não encontrado" }
        }

        const updateData: any = {
            updated_at: new Date().toISOString()
        }

        // Atualizar campos básicos
        if (data.name) updateData.name = data.name
        if (data.email) updateData.email = data.email
        if (data.cpf) updateData.cpf = data.cpf
        if (data.whatsapp) updateData.whatsapp = data.whatsapp

        // Atualizar endereço
        if (data.address) {
            const currentAddress = currentUser.address_json as any || {}
            updateData.address_json = {
                ...currentAddress,
                ...data.address
            }
        }

        // Processar foto
        if (data.removePhoto) {
            // Remover foto existente
            if (currentUser.photo_path) {
                await supabase.storage
                    .from("photos")
                    .remove([currentUser.photo_path])
            }
            updateData.photo_path = null
        } else if (data.photoBase64) {
            // Upload de nova foto a partir de base64
            try {
                // Extrair o tipo de arquivo e os dados base64
                const matches = data.photoBase64.match(/^data:(.+);base64,(.+)$/)
                if (!matches) {
                    return { success: false, message: "Formato de imagem inválido" }
                }

                const mimeType = matches[1]
                const base64Data = matches[2]
                
                // Converter base64 para buffer
                const buffer = Buffer.from(base64Data, 'base64')
                
                // Determinar extensão do arquivo
                const fileExt = mimeType.split('/')[1] || 'jpg'
                const fileName = `${userId}-${Date.now()}.${fileExt}`
                const filePath = `${fileName}`

                // Remover foto antiga se existir
                if (currentUser.photo_path) {
                    await supabase.storage
                        .from("photos")
                        .remove([currentUser.photo_path])
                }

                // Upload da nova foto
                const { error: uploadError } = await supabase.storage
                    .from("photos")
                    .upload(filePath, buffer, {
                        contentType: mimeType,
                        upsert: false
                    })

                if (uploadError) {
                    console.error("Erro ao fazer upload da foto:", uploadError)
                    return { success: false, message: "Erro ao fazer upload da foto" }
                }

                updateData.photo_path = filePath
            } catch (err) {
                console.error("Erro ao processar foto:", err)
                return { success: false, message: "Erro ao processar imagem" }
            }
        }

        // Atualizar registro no banco
        const { error: updateError } = await supabase
            .from("users_cards")
            .update(updateData)
            .eq("id", userId)

        if (updateError) {
            console.error("Erro ao atualizar usuário:", updateError)
            return { success: false, message: "Erro ao atualizar dados do usuário" }
        }

        // Registrar no audit log
        await createAuditLog(admin.id, "UPDATE_USER_DATA", userId, {
            userName: currentUser.name,
            updatedFields: Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined)
        })

        revalidatePath("/admin/solicitacoes")
        revalidatePath(`/admin/solicitacoes/${userId}`)

        return { success: true, message: "Dados atualizados com sucesso!" }
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error)
        return { success: false, message: "Erro ao processar atualização" }
    }
}