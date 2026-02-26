import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'
import { UpdateProjectData } from '@/lib/types/task-types'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/projects/[id]
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from('tasks_projects')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) {
            return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
        }

        return NextResponse.json(data)
    } catch (error) {
        return handleAuthError(error)
    }
}

// PATCH /api/admin/projects/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const body: UpdateProjectData = await request.json()

        const updates: Record<string, unknown> = {}
        if (body.name          !== undefined) updates.name          = body.name?.trim()
        if (body.description   !== undefined) updates.description   = body.description?.trim() || null
        if (body.manager_email !== undefined) updates.manager_email = body.manager_email?.trim()
        if (body.status        !== undefined) updates.status        = body.status
        if (body.start_date    !== undefined) updates.start_date    = body.start_date
        if (body.end_date      !== undefined) updates.end_date      = body.end_date || null
        if (body.is_archived   !== undefined) updates.is_archived   = body.is_archived

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
        }

        const supabase = getServiceSupabase()
        const { data, error } = await supabase
            .from('tasks_projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating project:', error)
            return NextResponse.json({ error: 'Falha ao atualizar projeto' }, { status: 500 })
        }

        // Ao arquivar/restaurar um projeto, propaga para todas as suas tarefas
        if (body.is_archived !== undefined) {
            await supabase
                .from('tasks_items')
                .update({ is_archived: body.is_archived })
                .eq('project_id', id)
        }

        return NextResponse.json(data)
    } catch (error) {
        return handleAuthError(error)
    }
}

// DELETE /api/admin/projects/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        // Bloqueia exclusão se o projeto possui tarefas vinculadas
        const { count } = await supabase
            .from('tasks_items')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', id)

        if ((count ?? 0) > 0) {
            return NextResponse.json(
                { error: 'Este projeto possui tarefas vinculadas e não pode ser excluído. Use o arquivamento para desativá-lo.' },
                { status: 409 }
            )
        }

        // Cascata elimina tasks_items, subtasks, comments e attachments
        // Mas precisamos remover os arquivos do Storage antes
        const { data: attachments } = await supabase
            .from('tasks_attachments')
            .select('file_path')
            .in(
                'task_id',
                supabase.from('tasks_items').select('id').eq('project_id', id) as unknown as string[]
            )

        if (attachments && attachments.length > 0) {
            await supabase.storage
                .from('task-attachments')
                .remove(attachments.map(a => a.file_path))
        }

        const { error } = await supabase
            .from('tasks_projects')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting project:', error)
            return NextResponse.json({ error: 'Falha ao excluir projeto' }, { status: 500 })
        }

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return handleAuthError(error)
    }
}
