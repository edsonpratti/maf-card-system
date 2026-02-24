import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAccess, handleAuthError } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/tasks/[id]/attachments
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdminAccess()
        const { id } = await params
        const supabase = getServiceSupabase()

        const { data, error } = await supabase
            .from('tasks_attachments')
            .select('*')
            .eq('task_id', id)
            .order('created_at')

        if (error) {
            return NextResponse.json({ error: 'Falha ao buscar anexos' }, { status: 500 })
        }

        // Gera URLs assinadas (1 hora)
        const withUrls = await Promise.all(
            (data ?? []).map(async (att) => {
                const { data: signed } = await supabase.storage
                    .from('task-attachments')
                    .createSignedUrl(att.file_path, 3600)
                return { ...att, signed_url: signed?.signedUrl ?? null }
            })
        )

        return NextResponse.json(withUrls)
    } catch (error) {
        return handleAuthError(error)
    }
}

// POST /api/admin/tasks/[id]/attachments — recebe multipart/form-data
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const admin = await verifyAdminAccess()
        const { id } = await params

        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'Arquivo excede o limite de 50 MB' }, { status: 400 })
        }

        const supabase  = getServiceSupabase()
        const timestamp = Date.now()
        const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filePath  = `tasks/${id}/${timestamp}-${safeName}`

        const bytes  = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(filePath, buffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: false,
            })

        if (uploadError) {
            console.error('Storage upload error:', uploadError)
            return NextResponse.json({ error: 'Falha no upload do arquivo' }, { status: 500 })
        }

        // Salva metadata no banco
        const { data, error: dbError } = await supabase
            .from('tasks_attachments')
            .insert({
                task_id:     id,
                file_name:   file.name,
                file_path:   filePath,
                file_size:   file.size,
                mime_type:   file.type || null,
                uploaded_by: admin.email ?? 'admin',
            })
            .select()
            .single()

        if (dbError) {
            // Tenta remover o arquivo do Storage se o DB falhou
            await supabase.storage.from('task-attachments').remove([filePath])
            console.error('Error saving attachment record:', dbError)
            return NextResponse.json({ error: 'Falha ao salvar registro do anexo' }, { status: 500 })
        }

        // Retorna com URL assinada
        const { data: signed } = await supabase.storage
            .from('task-attachments')
            .createSignedUrl(filePath, 3600)

        return NextResponse.json({ ...data, signed_url: signed?.signedUrl ?? null }, { status: 201 })
    } catch (error) {
        return handleAuthError(error)
    }
}
