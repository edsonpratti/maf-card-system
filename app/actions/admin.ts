"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminAccess } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"

async function createAuditLog(
    adminUserId: string,
    action: string,
    targetUserId: string | null = null,
    metadata: any = {}
) {
    const supabase = getServiceSupabase()
    console.log("📝 Criando log de auditoria:", { adminUserId, action, targetUserId, metadata })
    
    const { data, error } = await supabase.from("admin_audit_logs").insert({
        admin_user_id: adminUserId,
        action,
        target_user_id: targetUserId,
        metadata,
    }).select()
    
    if (error) {
        console.error("❌ Erro ao criar log:", error)
    } else {
        console.log("✅ Log criado com sucesso:", data)
    }
}

export async function getRequests(filterStatus?: string) {
    await verifyAdminAccess()
    
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
    await createAuditLog(user.id, newStatus, id, { reason })

    revalidatePath("/admin/solicitacoes")
    return { success: true }
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
        console.error("Error fetching audit logs:", error)
        return []
    }

    console.log("📊 Logs encontrados:", data?.length || 0)
    if (data && data.length > 0) {
        console.log("Primeiro log:", data[0])
    }

    return data || []
}

export async function createTestLog() {
    const user = await verifyAdminAccess()
    
    console.log("🧪 Criando log de teste...")
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

export async function getRegisteredStudents() {
    await verifyAdminAccess()
    
    const supabase = getServiceSupabase()
    
    // Busca alunas que fizeram login e foram autorizadas (status aprovado)
    const { data, error } = await supabase
        .from("users_cards")
        .select("*")
        .in("status", ["APROVADA_MANUAL", "AUTO_APROVADA"])
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching registered students:", error)
        return []
    }

    return data || []
}
