import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string; attachmentId: string }> }

// DELETE /api/admin/tasks/[id]/attachments/[attachmentId]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()
        const { attachmentId } = await params
        const supabase = getServiceSupabase()

        // Busca o file_path e task_id antes de deletar
        const { data: att } = await supabase
            .from('tasks_attachments')
            .select('file_path, task_id')
            .eq('id', attachmentId)
            .single()

        // Segurança: verifica se o admin é responsável pela tarefa pai
        if (att?.task_id) {
            const { data: task } = await supabase
                .from('tasks_items')
                .select('assignee_email')
                .eq('id', att.task_id)
                .single()

            if (task?.assignee_email && task.assignee_email !== admin.email) {
                return NextResponse.json(
                    { error: 'Apenas o responsável pela tarefa pode remover anexos' },
                    { status: 403 }
                )
            }
        }

        if (att?.file_path) {
            await supabase.storage
                .from('task-attachments')
                .remove([att.file_path])
        }

        const { error } = await supabase
            .from('tasks_attachments')
            .delete()
            .eq('id', attachmentId)

        if (error) {
            return NextResponse.json({ error: 'Falha ao excluir anexo' }, { status: 500 })
        }

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return handleAuthError(error)
    }
}
