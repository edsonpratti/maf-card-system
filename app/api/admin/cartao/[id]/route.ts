import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminAccess } from "@/lib/auth"
import { generateCardPNG } from "@/lib/pdf-generator"
import { generateCardNumber } from "@/lib/utils"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        // Verificar se é admin
        await verifyAdminAccess()
    } catch (error) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = getServiceSupabase()

    // Buscar o cartão
    const { data: userCard, error } = await supabase
        .from('users_cards')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !userCard) {
        return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 })
    }

    // Verificar se o cartão está aprovado
    if (userCard.status !== 'AUTO_APROVADA' && userCard.status !== 'APROVADA_MANUAL') {
        return NextResponse.json(
            { error: "Cartão não aprovado." },
            { status: 403 }
        )
    }

    // Gerar card_number e validation_token se não existirem
    let cardNumber = userCard.card_number
    let validationToken = userCard.validation_token

    if (!cardNumber || !validationToken) {
        console.log(`[ADMIN PDF] Gerando credenciais para cartão ${id}`)

        // Gerar card_number
        if (!cardNumber) {
            cardNumber = generateCardNumber()
        }

        // Gerar validation_token
        if (!validationToken) {
            validationToken = Array.from({ length: 64 }, () =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('')
        }

        // Atualizar no banco
        const { error: updateError } = await supabase
            .from('users_cards')
            .update({
                card_number: cardNumber,
                validation_token: validationToken,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (updateError) {
            console.error('[ADMIN PDF] Erro ao atualizar credenciais:', updateError)
        } else {
            console.log('[ADMIN PDF] Credenciais geradas e salvas')
        }
    }

    try {
        const pngBuffer = await generateCardPNG({
            name: userCard.name,
            cpf: userCard.cpf,
            cardNumber: cardNumber,
            qrToken: validationToken,
            photoPath: userCard.photo_path,
            certificationDate: userCard.certification_date || userCard.created_at,
        })

        // Sanitizar o nome do arquivo
        const safeCardNumber = userCard.card_number.replace(/[^a-zA-Z0-9-]/g, '_')

        // Retornar o PNG como download
        return new NextResponse(new Uint8Array(pngBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="cartao-maf-${safeCardNumber}.png"`,
                'Content-Length': pngBuffer.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        })
    } catch (error: any) {
        console.error("[ADMIN PNG] Erro ao gerar PNG:", error)
        return NextResponse.json(
            {
                error: "Erro ao gerar o PNG do cartão",
                details: error?.message || 'Erro desconhecido'
            },
            { status: 500 }
        )
    }
}
