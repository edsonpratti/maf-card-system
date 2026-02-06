"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// TODO: In real app, check if current user is admin using getUser() and metadata
// For MVP, we assume admin routes are protected by middleware or layout check

export async function getRequests(filterStatus?: string) {
    const supabase = getServiceSupabase()
    let query = supabase
        .from("users_cards")
        .select("*")
        .order("created_at", { ascending: false })

    if (filterStatus && filterStatus !== "ALL") {
        query = query.eq("status", filterStatus)
    }

    const { data, error } = await query

    if (error) {
        console.error(error)
        return []
    }

    return data
}

export async function updateRequestStatus(id: string, newStatus: string, reason?: string) {
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
        // Generate card number, token, PDF here or via trigger
        // For now, simple update
    }

    const { error } = await supabase
        .from("users_cards")
        .update(updateData)
        .eq("id", id)

    if (error) {
        console.error(error)
        return { success: false, message: error.message }
    }

    // Log action
    await supabase.from("admin_audit_logs").insert({
        action: newStatus,
        target_user_id: id,
        metadata: { reason },
    })

    revalidatePath("/admin/solicitacoes")
    return { success: true }
}

export async function deleteRequest(id: string) {
    const supabase = getServiceSupabase()
    const { error } = await supabase.from("users_cards").delete().eq("id", id)

    if (error) {
        return { success: false, message: error.message }
    }

    revalidatePath("/admin/solicitacoes")
    return { success: true }
}
