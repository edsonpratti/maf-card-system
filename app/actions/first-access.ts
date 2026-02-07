"use server"

import { getServiceSupabase } from "@/lib/supabase"

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
        console.error("Erro ao verificar token:", error)
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
            console.error("Erro ao criar usuário:", authError)
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
        console.error("Erro ao definir senha:", error)
        return { success: false, error: "Erro ao processar solicitação" }
    }
}
