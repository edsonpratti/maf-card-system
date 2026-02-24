import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'
import type { CreateTaskData } from '@/lib/types/task-types'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/projects/[id]/tasks — lista tarefas do projeto com progresso de sub tarefas
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        const { data: tasks, error } = await supabase
            .from('tasks_items')
            .select('*')
            .eq('project_id', id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching tasks:', error)
            return NextResponse.json({ error: 'Falha ao buscar tarefas' }, { status: 500 })
        }

        if (!tasks || tasks.length === 0) {
            return NextResponse.json([])
        }

        // Busca progresso das sub tarefas
        const { data: subtaskCounts } = await supabase
            .from('tasks_subtasks')
            .select('task_id, is_done')
            .in('task_id', tasks.map(t => t.id))

        const subtaskMap: Record<string, { total: number; done: number }> = {}
        for (const s of subtaskCounts ?? []) {
            if (!subtaskMap[s.task_id]) subtaskMap[s.task_id] = { total: 0, done: 0 }
            subtaskMap[s.task_id].total++
            if (s.is_done) subtaskMap[s.task_id].done++
        }

        const result = tasks.map(t => ({
            ...t,
            subtasks_count: subtaskMap[t.id]?.total ?? 0,
            subtasks_done:  subtaskMap[t.id]?.done  ?? 0,
        }))

        return NextResponse.json(result)
    } catch (error) {
        return handleAuthError(error)
    }
}

// POST /api/admin/projects/[id]/tasks — cria nova tarefa no projeto
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()
        const { id } = await params
        const body: CreateTaskData = await request.json()

        if (!body.title?.trim()) {
            return NextResponse.json({ error: 'O título da tarefa é obrigatório' }, { status: 400 })
        }

        const supabase = getServiceSupabase()

        // Verifica que o projeto existe
        const { data: project } = await supabase
            .from('tasks_projects')
            .select('id')
            .eq('id', id)
            .single()

        if (!project) {
            return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
        }

        const { data, error } = await supabase
            .from('tasks_items')
            .insert({
                project_id:     id,
                title:          body.title.trim(),
                description:    body.description?.trim() || null,
                done:           false,
                priority:       body.priority   ?? 'medium',
                assignee_email: body.assignee_email?.trim() || null,
                due_datetime:   body.due_datetime || null,
                column_id:      body.column_id   || null,
                created_by:     admin.email ?? 'admin',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating task:', error)
            return NextResponse.json({ error: 'Falha ao criar tarefa' }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return handleAuthError(error)
    }
}
