import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string; columnId: string }> }

// PATCH /api/admin/projects/[id]/columns/[columnId] — renomeia ou reposiciona coluna
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { columnId } = await params
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
            .from('tasks_columns')
            .update(updates)
            .eq('id', columnId)
            .select()
            .single()

        if (error) {
            console.error('Error updating column:', error)
            return NextResponse.json({ error: 'Falha ao atualizar coluna' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        return handleAuthError(error)
    }
}

// DELETE /api/admin/projects/[id]/columns/[columnId] — exclui coluna (tarefas ficam sem coluna)
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { columnId } = await params
        const supabase = getServiceSupabase()

        // column_id nas tarefas vira NULL automaticamente (ON DELETE SET NULL)
        const { error } = await supabase
            .from('tasks_columns')
            .delete()
            .eq('id', columnId)

        if (error) {
            console.error('Error deleting column:', error)
            return NextResponse.json({ error: 'Falha ao excluir coluna' }, { status: 500 })
        }

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return handleAuthError(error)
    }
}
