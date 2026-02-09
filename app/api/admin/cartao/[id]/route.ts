import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminAccess } from "@/lib/auth"
import { generateCardPDF } from "@/lib/pdf-generator"

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

    // Verificar se existe card_number e validation_token
    if (!userCard.card_number || !userCard.validation_token) {
        return NextResponse.json(
            { error: "Dados do cartão incompletos." },
            { status: 500 }
        )
    }

    try {
        // Gerar o PDF
        const pdfBuffer = await generateCardPDF({
            name: userCard.name,
            cpf: userCard.cpf,
            cardNumber: userCard.card_number,
            qrToken: userCard.validation_token,
        })

        // Retornar o PDF como download
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="cartao-maf-${userCard.card_number}.pdf"`,
            },
        })
    } catch (error) {
        console.error("Erro ao gerar PDF:", error)
        return NextResponse.json(
            { error: "Erro ao gerar o PDF do cartão" },
            { status: 500 }
        )
    }
}
