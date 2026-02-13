"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminAccess } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * Cria um log de auditoria
 */
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
        const timestamp = Date.now().toString(36)
        const randomPart = Math.random().toString(36).substring(2, 8)
        const cardNumber = `MAF-${timestamp}-${randomPart}`.toUpperCase()
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

    // Enviar email de notificação se o usuário já tem conta criada
    if (userData.auth_user_id && userData.email && userData.name) {
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
        message: "Acesso ao MAF Pro ID aprovado com sucesso!" +
            (userData.auth_user_id ? " Email de notificação enviado." : " Usuário receberá notificação ao criar a conta.")
    }
}
