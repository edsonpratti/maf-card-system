import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/tasks/[id]/logs — histórico de atividades da tarefa (somente leitura)
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from('tasks_logs')
            .select('id, actor_email, action, detail, created_at')
            .eq('task_id', id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching task logs:', error)
            return NextResponse.json({ error: 'Falha ao buscar logs' }, { status: 500 })
        }

        return NextResponse.json(data ?? [])
    } catch (error) {
        return handleAuthError(error)
    }
}
