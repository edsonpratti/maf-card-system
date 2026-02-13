/**
 * Biblioteca para verificar e gerenciar acesso ao módulo MAF Pro ID
 * 
 * O acesso ao MAF Pro ID é separado do acesso ao sistema:
 * - Usuários podem fazer login com is_active = true
 * - Mas só acessam o MAF Pro ID se maf_pro_id_approved = true
 */

import { getServiceSupabase } from "@/lib/supabase"

export interface MafProIdAccessStatus {
    hasAccess: boolean
    approved: boolean
    approvedAt: string | null
    approvedBy: string | null
    status: string
    message: string
}

/**
 * Verifica se um usuário tem acesso aprovado ao MAF Pro ID
 * @param userId ID do usuário na tabela users_cards
 * @returns true se o acesso está aprovado, false caso contrário
 */
export async function checkMafProIdAccess(userId: string): Promise<boolean> {
    try {
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from("users_cards")
            .select("maf_pro_id_approved")
            .eq("id", userId)
            .single()

        if (error || !data) {
            console.error("Erro ao verificar acesso ao MAF Pro ID:", error)
            return false
        }

        return data.maf_pro_id_approved === true
    } catch (error) {
        console.error("Erro ao verificar acesso ao MAF Pro ID:", error)
        return false
    }
}

/**
 * Obtém o status detalhado do acesso ao MAF Pro ID
 * @param userId ID do usuário na tabela users_cards
 * @returns Objeto com informações detalhadas sobre o status de acesso
 */
export async function getMafProIdStatus(userId: string): Promise<MafProIdAccessStatus> {
    try {
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from("users_cards")
            .select("maf_pro_id_approved, maf_pro_id_approved_at, maf_pro_id_approved_by, status")
            .eq("id", userId)
            .single()

        if (error || !data) {
            return {
                hasAccess: false,
                approved: false,
                approvedAt: null,
                approvedBy: null,
                status: "UNKNOWN",
                message: "Não foi possível verificar o status de acesso"
            }
        }

        const hasAccess = data.maf_pro_id_approved === true

        let message = ""
        if (hasAccess) {
            message = "Acesso ao MAF Pro ID aprovado"
        } else if (data.status === "PENDENTE_MANUAL") {
            message = "Seu cadastro está em análise. Você receberá um email quando for aprovado."
        } else if (data.status === "RECUSADA") {
            message = "Seu cadastro foi recusado. Entre em contato para mais informações."
        } else {
            message = "Aguardando aprovação do administrador"
        }

        return {
            hasAccess,
            approved: data.maf_pro_id_approved || false,
            approvedAt: data.maf_pro_id_approved_at,
            approvedBy: data.maf_pro_id_approved_by,
            status: data.status,
            message
        }
    } catch (error) {
        console.error("Erro ao obter status do MAF Pro ID:", error)
        return {
            hasAccess: false,
            approved: false,
            approvedAt: null,
            approvedBy: null,
            status: "ERROR",
            message: "Erro ao verificar status de acesso"
        }
    }
}

/**
 * Verifica se um usuário tem acesso ao MAF Pro ID baseado no auth_user_id
 * @param authUserId ID do usuário no auth.users
 * @returns true se o acesso está aprovado, false caso contrário
 */
export async function checkMafProIdAccessByAuthId(authUserId: string): Promise<boolean> {
    try {
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from("users_cards")
            .select("maf_pro_id_approved")
            .eq("auth_user_id", authUserId)
            .single()

        if (error || !data) {
            console.error("Erro ao verificar acesso ao MAF Pro ID:", error)
            return false
        }

        return data.maf_pro_id_approved === true
    } catch (error) {
        console.error("Erro ao verificar acesso ao MAF Pro ID:", error)
        return false
    }
}

/**
 * Obtém o card_id (users_cards.id) baseado no auth_user_id
 * @param authUserId ID do usuário no auth.users
 * @returns ID do card ou null se não encontrado
 */
export async function getCardIdByAuthId(authUserId: string): Promise<string | null> {
    try {
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from("users_cards")
            .select("id")
            .eq("auth_user_id", authUserId)
            .single()

        if (error || !data) {
            return null
        }

        return data.id
    } catch (error) {
        console.error("Erro ao obter card_id:", error)
        return null
    }
}
