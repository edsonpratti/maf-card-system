import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, getCurrentUser, handleAuthError } from '@/lib/auth'
import type { AdminMember } from '@/lib/types/task-types'

// GET /api/admin/admin-members — lista admins para dropdowns de gerente/responsável
export async function GET() {
    try {
        const currentUser = await verifyAdminAccess()

        const supabase = getServiceSupabase()

        // Tenta buscar com a coluna role; se não existir (migração antiga), busca sem ela
        let tableAdmins: AdminMember[] = []
        const { data: withRole, error: roleErr } = await supabase
            .from('admin_users')
            .select('id, name, email, role')
            .order('name')

        if (roleErr) {
            // Provavelmente a coluna role ainda não existe — tenta sem ela
            const { data: withoutRole } = await supabase
                .from('admin_users')
                .select('id, name, email')
                .order('name')

            tableAdmins = (withoutRole ?? []).map((u: { id: string; name: string; email: string }) => ({
                ...u,
                role: 'master' as const,
            }))
        } else {
            tableAdmins = (withRole ?? []).map((u) => ({
                ...u,
                role: (u.role === 'operator' ? 'operator' : 'master') as 'master' | 'operator',
            }))
        }

        // Inclui o admin logado se ele não estiver na tabela admin_users
        // (admins criados via Supabase Dashboard ficam apenas no auth)
        const currentEmail = currentUser?.email ?? ''
        const alreadyInTable = tableAdmins.some((a) => a.email === currentEmail)

        if (!alreadyInTable && currentEmail) {
            const name =
                currentUser?.user_metadata?.name ||
                currentUser?.email?.split('@')[0] ||
                'Admin'

            tableAdmins = [
                ...tableAdmins,
                {
                    id: `auth-${currentUser?.id}`,
                    name,
                    email: currentEmail,
                    role: 'master' as const,
                },
            ].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        }

        return NextResponse.json(tableAdmins)
    } catch (error) {
        return handleAuthError(error)
    }
}
