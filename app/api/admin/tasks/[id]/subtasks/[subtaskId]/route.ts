import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'
import { UpdateSubtaskData } from '@/lib/types/task-types'
import { logTaskEvent } from '@/lib/utils/task-logger'

type RouteParams = { params: Promise<{ id: string; subtaskId: string }> }

// PATCH /api/admin/tasks/[id]/subtasks/[subtaskId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()
        const { id, subtaskId } = await params
        const supabase = getServiceSupabase()

        // Segurança: verifica se o admin é responsável pela tarefa pai
        const { data: subtask } = await supabase
            .from('tasks_subtasks')
            .select('task_id, title, is_done')
            .eq('id', subtaskId)
            .single()

        if (!subtask) {
            return NextResponse.json({ error: 'Sub tarefa não encontrada' }, { status: 404 })
        }
        const { data: parentTask } = await supabase
            .from('tasks_items')
            .select('assignee_email')
            .eq('id', subtask.task_id)
            .single()

        if (parentTask?.assignee_email && parentTask.assignee_email !== admin.email) {
            return NextResponse.json(
                { error: 'Apenas o responsável pela tarefa pode editar sub tarefas' },
                { status: 403 }
            )
        }

        const body: UpdateSubtaskData = await request.json()

        const updates: Record<string, unknown> = {}
        if (body.title          !== undefined) updates.title          = body.title?.trim()
        if (body.assignee_email !== undefined) updates.assignee_email = body.assignee_email?.trim() || null
        if (body.due_date       !== undefined) updates.due_date       = body.due_date || null
        if (body.is_done        !== undefined) updates.is_done        = body.is_done

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('tasks_subtasks')
            .update(updates)
            .eq('id', subtaskId)
            .select()
            .single()

        if (error) {
            console.error('Error updating subtask:', error)
            return NextResponse.json({ error: 'Falha ao atualizar sub tarefa' }, { status: 500 })
        }

        // Log: conclusão / reabertura / edição
        if (body.is_done !== undefined && body.is_done !== subtask.is_done) {
            const action = body.is_done ? 'subtask_completed' : 'subtask_reopened'
            const label  = body.is_done ? 'concluída' : 'reaberta'
            await logTaskEvent(id, admin.email ?? 'admin', action, `Sub tarefa ${label}: "${subtask.title}"`)
        } else if (body.title && body.title !== subtask.title) {
            await logTaskEvent(id, admin.email ?? 'admin', 'subtask_added', `Sub tarefa renomeada: "${subtask.title}" → "${body.title}"`)
        }

        return NextResponse.json(data)
    } catch (error) {
        return handleAuthError(error)
    }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()
        const { id, subtaskId } = await params
        const supabase = getServiceSupabase()

        // Segurança: verifica se o admin é responsável pela tarefa pai
        const { data: subtask } = await supabase
            .from('tasks_subtasks')
            .select('task_id, title')
            .eq('id', subtaskId)
            .single()

        if (subtask) {
            const { data: parentTask } = await supabase
                .from('tasks_items')
                .select('assignee_email')
                .eq('id', subtask.task_id)
                .single()

            if (parentTask?.assignee_email && parentTask.assignee_email !== admin.email) {
                return NextResponse.json(
                    { error: 'Apenas o responsável pela tarefa pode excluir sub tarefas' },
                    { status: 403 }
                )
            }
        }

        const { error } = await supabase
            .from('tasks_subtasks')
            .delete()
            .eq('id', subtaskId)

        if (error) {
            return NextResponse.json({ error: 'Falha ao excluir sub tarefa' }, { status: 500 })
        }

        await logTaskEvent(id, admin.email ?? 'admin', 'subtask_deleted', `Sub tarefa removida: "${subtask?.title ?? ''}"` )

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return handleAuthError(error)
    }
}
