import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string; commentId: string }> }

// DELETE /api/admin/tasks/[id]/comments/[commentId]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { commentId } = await params
        const supabase = getServiceSupabase()

        const { error } = await supabase
            .from('tasks_comments')
            .delete()
            .eq('id', commentId)

        if (error) {
            return NextResponse.json({ error: 'Falha ao excluir comentário' }, { status: 500 })
        }

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return handleAuthError(error)
    }
}
