import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'
import type { UpdateTaskData } from '@/lib/types/task-types'
import { logTaskEvent, diffTaskFields } from '@/lib/utils/task-logger'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/tasks/[id] — detalhe completo com subtasks, comments e attachments
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        const [
            { data: task,        error: taskError },
            { data: subtasks },
            { data: comments },
            { data: attachments },
        ] = await Promise.all([
            supabase.from('tasks_items').select('*').eq('id', id).single(),
            supabase.from('tasks_subtasks').select('*').eq('task_id', id).order('created_at'),
            supabase.from('tasks_comments').select('*').eq('task_id', id).order('created_at'),
            supabase.from('tasks_attachments').select('*').eq('task_id', id).order('created_at'),
        ])

        if (taskError || !task) {
            return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
        }

        // Gera URLs assinadas para os anexos (1 hora de validade)
        const attachmentsWithUrls = await Promise.all(
            (attachments ?? []).map(async (att) => {
                const { data: signedData } = await supabase.storage
                    .from('task-attachments')
                    .createSignedUrl(att.file_path, 3600)
                return { ...att, signed_url: signedData?.signedUrl ?? null }
            })
        )

        return NextResponse.json({
            ...task,
            subtasks:    subtasks    ?? [],
            comments:    comments    ?? [],
            attachments: attachmentsWithUrls,
        })
    } catch (error) {
        return handleAuthError(error)
    }
}

// PATCH /api/admin/tasks/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        // Busca tarefa existente para validação e diff de logs
        const { data: existing } = await supabase
            .from('tasks_items')
            .select('assignee_email, title, description, done, priority, due_datetime, column_id')
            .eq('id', id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
        }
        if (existing.assignee_email && existing.assignee_email !== admin.email) {
            return NextResponse.json(
                { error: 'Apenas o responsável pela tarefa pode editá-la' },
                { status: 403 }
            )
        }

        const body: UpdateTaskData = await request.json()

        const updates: Record<string, unknown> = {}
        if (body.title          !== undefined) updates.title          = body.title?.trim()
        if (body.description    !== undefined) updates.description    = body.description?.trim() || null
        if (body.done           !== undefined) updates.done           = body.done
        if (body.priority       !== undefined) updates.priority       = body.priority
        if (body.assignee_email !== undefined) updates.assignee_email = body.assignee_email?.trim() || null
        if (body.due_datetime   !== undefined) updates.due_datetime   = body.due_datetime || null
        if (body.column_id      !== undefined) updates.column_id      = body.column_id ?? null

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('tasks_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating task:', error)
            return NextResponse.json({ error: 'Falha ao atualizar tarefa' }, { status: 500 })
        }

        // Escreve um log por campo alterado
        const logEntries = diffTaskFields(existing as Record<string, unknown>, updates)
        for (const entry of logEntries) {
            await logTaskEvent(id, admin.email ?? 'admin', entry.action, entry.detail)
        }

        return NextResponse.json(data)
    } catch (error) {
        return handleAuthError(error)
    }
}

// DELETE /api/admin/tasks/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        // Segurança: apenas o responsável pela tarefa pode excluí-la
        const { data: existing } = await supabase
            .from('tasks_items')
            .select('assignee_email')
            .eq('id', id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
        }
        if (existing.assignee_email && existing.assignee_email !== admin.email) {
            return NextResponse.json(
                { error: 'Apenas o responsável pela tarefa pode excluí-la' },
                { status: 403 }
            )
        }

        // Remove arquivos do Storage antes de deletar o registro
        const { data: attachments } = await supabase
            .from('tasks_attachments')
            .select('file_path')
            .eq('task_id', id)

        if (attachments && attachments.length > 0) {
            await supabase.storage
                .from('task-attachments')
                .remove(attachments.map(a => a.file_path))
        }

        const { error } = await supabase
            .from('tasks_items')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting task:', error)
            return NextResponse.json({ error: 'Falha ao excluir tarefa' }, { status: 500 })
        }

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return handleAuthError(error)
    }
}

