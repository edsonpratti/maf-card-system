import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

async function isMasterAdmin(email: string): Promise<boolean> {
    const supabase = getServiceSupabase()
    const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', email)
        .single()
    // Admin não encontrado na tabela = master original criado via Supabase Dashboard
    return !data || data.role === 'master'
}

// GET /api/admin/tasks/system-columns — lista colunas do sistema, ordenadas por posição
export async function GET() {
    try {
        await verifyAdminAccess()
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from('tasks_system_columns')
            .select('*')
            .order('position', { ascending: true })

        if (error) {
            console.error('Error fetching system columns:', error)
            return NextResponse.json({ error: 'Falha ao buscar colunas do sistema' }, { status: 500 })
        }

        return NextResponse.json(data ?? [])
    } catch (error) {
        return handleAuthError(error)
    }
}

// POST /api/admin/tasks/system-columns — cria nova coluna do sistema (apenas master)
export async function POST(request: NextRequest) {
    try {
        const admin = await verifyAdminAccess()

        if (!await isMasterAdmin(admin.email!)) {
            return NextResponse.json(
                { error: 'Apenas administradores master podem criar colunas do sistema' },
                { status: 403 }
            )
        }

        const body: { name: string; color?: string } = await request.json()

        if (!body.name?.trim()) {
            return NextResponse.json({ error: 'Nome da coluna é obrigatório' }, { status: 400 })
        }

        const supabase = getServiceSupabase()

        // Posição = última + 1
        const { data: existing } = await supabase
            .from('tasks_system_columns')
            .select('position')
            .order('position', { ascending: false })
            .limit(1)

        const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

        const { data, error } = await supabase
            .from('tasks_system_columns')
            .insert({
                name:     body.name.trim(),
                color:    body.color ?? null,
                position: nextPosition,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating system column:', error)
            return NextResponse.json({ error: 'Falha ao criar coluna do sistema' }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return handleAuthError(error)
    }
}
