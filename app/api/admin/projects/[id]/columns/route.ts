import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/projects/[id]/columns — lista colunas kanban do projeto, ordenadas por posição
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from('tasks_columns')
            .select('*')
            .eq('project_id', id)
            .order('position', { ascending: true })

        if (error) {
            console.error('Error fetching columns:', error)
            return NextResponse.json({ error: 'Falha ao buscar colunas' }, { status: 500 })
        }

        return NextResponse.json(data ?? [])
    } catch (error) {
        return handleAuthError(error)
    }
}

// POST /api/admin/projects/[id]/columns — cria nova coluna kanban
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const body: { name: string; color?: string } = await request.json()

        if (!body.name?.trim()) {
            return NextResponse.json({ error: 'Nome da coluna é obrigatório' }, { status: 400 })
        }

        const supabase = getServiceSupabase()

        // Posição = última + 1
        const { data: existing } = await supabase
            .from('tasks_columns')
            .select('position')
            .eq('project_id', id)
            .order('position', { ascending: false })
            .limit(1)

        const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

        const { data, error } = await supabase
            .from('tasks_columns')
            .insert({
                project_id: id,
                name:       body.name.trim(),
                color:      body.color ?? null,
                position:   nextPosition,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating column:', error)
            return NextResponse.json({ error: 'Falha ao criar coluna' }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return handleAuthError(error)
    }
}
