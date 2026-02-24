import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'
import { CreateSubtaskData } from '@/lib/types/task-types'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/tasks/[id]/subtasks
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from('tasks_subtasks')
            .select('*')
            .eq('task_id', id)
            .order('created_at')

        if (error) {
            return NextResponse.json({ error: 'Falha ao buscar sub tarefas' }, { status: 500 })
        }

        return NextResponse.json(data ?? [])
    } catch (error) {
        return handleAuthError(error)
    }
}

// POST /api/admin/tasks/[id]/subtasks
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()
        const { id } = await params
        const body: CreateSubtaskData = await request.json()

        if (!body.title?.trim()) {
            return NextResponse.json({ error: 'O título da sub tarefa é obrigatório' }, { status: 400 })
        }

        const supabase = getServiceSupabase()
        const { data, error } = await supabase
            .from('tasks_subtasks')
            .insert({
                task_id:        id,
                title:          body.title.trim(),
                assignee_email: body.assignee_email?.trim() || null,
                due_date:       body.due_date || null,
                is_done:        false,
                created_by:     admin.email ?? 'admin',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating subtask:', error)
            return NextResponse.json({ error: 'Falha ao criar sub tarefa' }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return handleAuthError(error)
    }
}
