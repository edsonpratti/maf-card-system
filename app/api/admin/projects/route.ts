import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'
import { CreateProjectData } from '@/lib/types/task-types'

// GET /api/admin/projects — lista projetos com contagem de tarefas
export async function GET() {
    try {
        await verifyAdminAccess()
        const supabase = getServiceSupabase()

        const { data: projects, error: projectsError } = await supabase
            .from('tasks_projects')
            .select('*')
            .order('created_at', { ascending: false })

        if (projectsError) {
            console.error('Error fetching projects:', projectsError)
            return NextResponse.json({ error: 'Falha ao buscar projetos' }, { status: 500 })
        }

        if (!projects || projects.length === 0) {
            return NextResponse.json([])
        }

        // Busca contagem de tarefas por projeto
        const { data: taskCounts } = await supabase
            .from('tasks_items')
            .select('project_id, done')
            .in('project_id', projects.map(p => p.id))

        // Computa counts no lado do servidor
        const countsMap: Record<string, { total: number; done: number }> = {}
        for (const t of taskCounts ?? []) {
            if (!countsMap[t.project_id]) countsMap[t.project_id] = { total: 0, done: 0 }
            countsMap[t.project_id].total++
            if (t.done === true) countsMap[t.project_id].done++
        }

        const result = projects.map(p => ({
            ...p,
            tasks_count: countsMap[p.id]?.total ?? 0,
            tasks_done:  countsMap[p.id]?.done  ?? 0,
        }))

        return NextResponse.json(result)
    } catch (error) {
        return handleAuthError(error)
    }
}

// POST /api/admin/projects — cria novo projeto
export async function POST(request: NextRequest) {
    try {
        const admin = await verifyAdminAccess()
        const body: CreateProjectData = await request.json()

        if (!body.name?.trim()) {
            return NextResponse.json({ error: 'O nome do projeto é obrigatório' }, { status: 400 })
        }
        if (!body.manager_email?.trim()) {
            return NextResponse.json({ error: 'O gerente do projeto é obrigatório' }, { status: 400 })
        }
        if (!body.start_date) {
            return NextResponse.json({ error: 'A data de início é obrigatória' }, { status: 400 })
        }

        const supabase = getServiceSupabase()
        const { data, error } = await supabase
            .from('tasks_projects')
            .insert({
                name:          body.name.trim(),
                description:   body.description?.trim() || null,
                manager_email: body.manager_email.trim(),
                status:        body.status ?? 'active',
                start_date:    body.start_date,
                end_date:      body.end_date || null,
                created_by:    admin.email ?? 'admin',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating project:', error)
            return NextResponse.json({ error: 'Falha ao criar projeto' }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return handleAuthError(error)
    }
}
