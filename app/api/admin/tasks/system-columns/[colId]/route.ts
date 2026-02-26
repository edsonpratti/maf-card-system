import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

type RouteParams = { params: Promise<{ colId: string }> }

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

// PATCH /api/admin/tasks/system-columns/[colId] — renomeia ou reposiciona coluna (apenas master)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()

        if (!await isMasterAdmin(admin.email!)) {
            return NextResponse.json(
                { error: 'Apenas administradores master podem renomear colunas do sistema' },
                { status: 403 }
            )
        }

        const { colId } = await params
        const body: { name?: string; color?: string; position?: number } = await request.json()

        const updates: Record<string, unknown> = {}
        if (body.name     !== undefined) updates.name     = body.name.trim()
        if (body.color    !== undefined) updates.color    = body.color ?? null
        if (body.position !== undefined) updates.position = body.position

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
        }

        const supabase = getServiceSupabase()
        const { data, error } = await supabase
            .from('tasks_system_columns')
            .update(updates)
            .eq('id', colId)
            .select()
            .single()

        if (error) {
            console.error('Error updating system column:', error)
            return NextResponse.json({ error: 'Falha ao atualizar coluna do sistema' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        return handleAuthError(error)
    }
}

// DELETE /api/admin/tasks/system-columns/[colId] — exclui coluna do sistema (apenas master)
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()

        if (!await isMasterAdmin(admin.email!)) {
            return NextResponse.json(
                { error: 'Apenas administradores master podem excluir colunas do sistema' },
                { status: 403 }
            )
        }

        const { colId } = await params
        const supabase = getServiceSupabase()

        // column_id nas tarefas vira NULL automaticamente (ON DELETE SET NULL)
        const { error } = await supabase
            .from('tasks_system_columns')
            .delete()
            .eq('id', colId)

        if (error) {
            console.error('Error deleting system column:', error)
            return NextResponse.json({ error: 'Falha ao excluir coluna do sistema' }, { status: 500 })
        }

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return handleAuthError(error)
    }
}
