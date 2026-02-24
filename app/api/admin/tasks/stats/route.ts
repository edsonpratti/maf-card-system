import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

// GET /api/admin/tasks/stats — visão geral para o dashboard MAF Pro Tasks
export async function GET() {
    try {
        await verifyAdminAccess()
        const supabase = getServiceSupabase()

        // Busca todos os projetos
        const { data: projects } = await supabase
            .from('tasks_projects')
            .select('id, name, status')
            .order('created_at', { ascending: false })

        // Busca todas as tarefas com campos necessários para stats
        const { data: tasks, error } = await supabase
            .from('tasks_items')
            .select('id, title, done, due_datetime, priority, project_id, assignee_email')
            .order('due_datetime', { ascending: true, nullsFirst: false })

        if (error) return NextResponse.json({ error: 'Falha ao buscar tarefas' }, { status: 500 })

        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

        const projectMap: Record<string, string> = {}
        for (const p of projects ?? []) projectMap[p.id] = p.name

        const allTasks = tasks ?? []

        // Classificação
        const doneTasks    = allTasks.filter(t => t.done)
        const overdueTasks = allTasks.filter(t => !t.done && t.due_datetime && new Date(t.due_datetime) < todayStart)
        const todayTasks   = allTasks.filter(t => !t.done && t.due_datetime && new Date(t.due_datetime) >= todayStart && new Date(t.due_datetime) <= todayEnd)
        const activeTasks  = allTasks.filter(t => !t.done && (!t.due_datetime || new Date(t.due_datetime) >= todayStart))

        // Resumo por projeto
        const byProject = (projects ?? []).map(p => {
            const pTasks   = allTasks.filter(t => t.project_id === p.id)
            const pDone    = pTasks.filter(t => t.done)
            const pOverdue = pTasks.filter(t => !t.done && t.due_datetime && new Date(t.due_datetime) < todayStart)
            return {
                project_id:   p.id,
                project_name: p.name,
                status:       p.status,
                total:        pTasks.length,
                done:         pDone.length,
                overdue:      pOverdue.length,
                active:       pTasks.length - pDone.length - pOverdue.length,
            }
        })

        return NextResponse.json({
            total:          allTasks.length,
            done:           doneTasks.length,
            overdue:        overdueTasks.length,
            active:         activeTasks.length,
            projects_count: (projects ?? []).length,
            today_tasks:    todayTasks.map(t => ({ ...t, project_name: projectMap[t.project_id] ?? '' })),
            overdue_tasks:  overdueTasks.map(t => ({ ...t, project_name: projectMap[t.project_id] ?? '' })),
            by_project:     byProject,
        })
    } catch (error) {
        return handleAuthError(error)
    }
}
