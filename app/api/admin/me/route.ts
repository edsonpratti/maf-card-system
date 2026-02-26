import { NextResponse } from 'next/server'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'
import { getServiceSupabase } from '@/lib/supabase'

// GET /api/admin/me — retorna o email e role do admin autenticado
export async function GET() {
    try {
        const admin = await verifyAdminAccess()
        const supabase = getServiceSupabase()

        const { data } = await supabase
            .from('admin_users')
            .select('role')
            .eq('email', admin.email!)
            .single()

        // Admin não encontrado na tabela = master original (criado via Supabase Dashboard)
        const role: 'master' | 'operator' = (data?.role as 'master' | 'operator') ?? 'master'

        return NextResponse.json({ email: admin.email ?? '', role })
    } catch (error) {
        return handleAuthError(error)
    }
}
