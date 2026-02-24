import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'
import { CreateTaskData } from '@/lib/types/task-types'

// GET /api/admin/tasks — listar tarefas com filtros opcionais
export async function GET(request: NextRequest) {
    try {
        await verifyAdminAccess()

        const { searchParams } = new URL(request.url)
        const status    = searchParams.get('status')
        const priority  = searchParams.get('priority')
        const assignedTo = searchParams.get('assigned_to')

        const supabase = getServiceSupabase()
        let query = supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false })

        if (status)     query = query.eq('status', status)
        if (priority)   query = query.eq('priority', priority)
        if (assignedTo) query = query.eq('assigned_to', assignedTo)

        const { data, error } = await query

        if (error) {
            console.error('Error fetching tasks:', error)
            return NextResponse.json({ error: 'Falha ao buscar tarefas' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        return handleAuthError(error)
    }
}

// POST /api/admin/tasks — criar nova tarefa
export async function POST(request: NextRequest) {
    try {
        const admin = await verifyAdminAccess()

        const body: CreateTaskData = await request.json()

        if (!body.title?.trim()) {
            return NextResponse.json(
                { error: 'O título da tarefa é obrigatório' },
                { status: 400 }
            )
        }

        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                title:          body.title.trim(),
                description:    body.description?.trim() || null,
                done:           false,
                priority:       body.priority ?? 'medium',
                assignee_email: body.assignee_email?.trim() || null,
                due_datetime:   body.due_datetime || null,
                column_id:      body.column_id || null,
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
