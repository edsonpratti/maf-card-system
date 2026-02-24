import { NextResponse } from 'next/server'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

// GET /api/admin/me — retorna o email do admin autenticado (usado para verificar ownership de tarefas)
export async function GET() {
    try {
        const admin = await verifyAdminAccess()
        return NextResponse.json({ email: admin.email ?? '' })
    } catch (error) {
        return handleAuthError(error)
    }
}
