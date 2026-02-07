"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Verifica se o usuário atual tem permissões de administrador
 * @throws Error se o usuário não estiver autenticado ou não for admin
 * @returns O objeto do usuário autenticado
 */
export async function verifyAdminAccess() {
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
    
    if (!user) {
        throw new Error('Unauthorized: Authentication required')
    }
    
    const isAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
    if (!isAdmin) {
        throw new Error('Forbidden: Admin access required')
    }
    
    return user
}

/**
 * Obtém o usuário atual sem verificar permissões de admin
 * @returns O objeto do usuário autenticado ou null
 */
export async function getCurrentUser() {
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

/**
 * Verifica se o usuário atual é um administrador
 * @returns true se o usuário for admin, false caso contrário
 */
export async function isAdmin() {
    try {
        const user = await getCurrentUser()
        return user?.user_metadata?.is_admin === true || user?.app_metadata?.is_admin === true
    } catch {
        return false
    }
}
