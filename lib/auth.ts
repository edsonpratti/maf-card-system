import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

/**
 * Classe de erro para autenticação
 */
export class AuthError extends Error {
    public statusCode: number
    
    constructor(message: string, statusCode: number = 401) {
        super(message)
        this.name = 'AuthError'
        this.statusCode = statusCode
    }
}

/**
 * Helper para tratar erros de autenticação em rotas API
 * @param error O erro capturado
 * @returns NextResponse com status apropriado
 */
export function handleAuthError(error: unknown): NextResponse {
    if (error instanceof AuthError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        )
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Authentication')) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (errorMessage.includes('Forbidden') || errorMessage.includes('Admin')) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
}

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
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
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
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
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
