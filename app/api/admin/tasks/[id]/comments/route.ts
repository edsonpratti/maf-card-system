import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'
import { logTaskEvent } from '@/lib/utils/task-logger'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/tasks/[id]/comments
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from('tasks_comments')
            .select('*')
            .eq('task_id', id)
            .order('created_at')

        if (error) {
            return NextResponse.json({ error: 'Falha ao buscar comentários' }, { status: 500 })
        }

        return NextResponse.json(data ?? [])
    } catch (error) {
        return handleAuthError(error)
    }
}

// POST /api/admin/tasks/[id]/comments
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()
        const { id } = await params
        const { content } = await request.json()

        if (!content?.trim()) {
            return NextResponse.json({ error: 'O comentário não pode estar vazio' }, { status: 400 })
        }

        const supabase = getServiceSupabase()
        const { data, error } = await supabase
            .from('tasks_comments')
            .insert({
                task_id:      id,
                content:      content.trim(),
                author_email: admin.email ?? 'admin',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating comment:', error)
            return NextResponse.json({ error: 'Falha ao adicionar comentário' }, { status: 500 })
        }

        await logTaskEvent(id, admin.email ?? 'admin', 'comment_added', 'Comentário adicionado')

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        return handleAuthError(error)
    }
}
