import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

// GET /api/admin/tasks/my-tasks
// Retorna todas as tarefas atribuídas ao admin logado, em todos os projetos.
export async function GET() {
    try {
        const admin = await verifyAdminAccess()
        const supabase = getServiceSupabase()

        // Busca tarefas onde o responsável é o usuário logado
        const { data: tasks, error } = await supabase
            .from('tasks_items')
            .select(`
                id,
                project_id,
                title,
                description,
                done,
                priority,
                assignee_email,
                due_datetime,
                column_id,
                created_by,
                created_at,
                updated_at,
                subtasks_count:tasks_subtasks(count),
                subtasks_done:tasks_subtasks(count)
            `)
            .eq('assignee_email', admin.email ?? '')
            .eq('is_archived', false)
            .order('due_datetime', { ascending: true, nullsFirst: false })

        if (error) {
            console.error('Error fetching my tasks:', error)
            return NextResponse.json({ error: 'Falha ao buscar tarefas' }, { status: 500 })
        }

        // Busca os projetos correspondentes para obter o nome
        const projectIds = [...new Set((tasks ?? []).map(t => t.project_id))]

        let projectMap: Record<string, { name: string; status: string }> = {}

        if (projectIds.length > 0) {
            const { data: projects } = await supabase
                .from('tasks_projects')
                .select('id, name, status')
                .in('id', projectIds)

            for (const p of projects ?? []) {
                projectMap[p.id] = { name: p.name, status: p.status }
            }
        }

        // Busca subtasks para calcular contagens corretamente
        const taskIds = (tasks ?? []).map(t => t.id)
        let subtaskMap: Record<string, { total: number; done: number }> = {}

        if (taskIds.length > 0) {
            const { data: subtasks } = await supabase
                .from('tasks_subtasks')
                .select('task_id, is_done')
                .in('task_id', taskIds)

            for (const s of subtasks ?? []) {
                if (!subtaskMap[s.task_id]) subtaskMap[s.task_id] = { total: 0, done: 0 }
                subtaskMap[s.task_id].total++
                if (s.is_done) subtaskMap[s.task_id].done++
            }
        }

        const enriched = (tasks ?? []).map(t => ({
            id:             t.id,
            project_id:     t.project_id,
            project_name:   projectMap[t.project_id]?.name ?? '',
            project_status: projectMap[t.project_id]?.status ?? '',
            title:          t.title,
            description:    t.description,
            done:           t.done,
            priority:       t.priority,
            assignee_email: t.assignee_email,
            due_datetime:   t.due_datetime,
            column_id:      t.column_id,
            created_by:     t.created_by,
            created_at:     t.created_at,
            updated_at:     t.updated_at,
            subtasks_count: subtaskMap[t.id]?.total ?? 0,
            subtasks_done:  subtaskMap[t.id]?.done  ?? 0,
        }))

        return NextResponse.json({ tasks: enriched, email: admin.email })
    } catch (error) {
        return handleAuthError(error)
    }
}
