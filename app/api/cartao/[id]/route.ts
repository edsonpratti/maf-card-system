import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateCardPDF } from "@/lib/pdf-generator"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar o cartão do usuário
    const { data: userCard, error } = await supabase
        .from('users_cards')
        .select('*')
        .eq('id', id)
        .eq('email', user.email) // Garantir que o usuário só acesse seu próprio cartão
        .single()

    if (error || !userCard) {
        return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 })
    }

    // Verificar se o cartão está aprovado
    if (userCard.status !== 'AUTO_APROVADA' && userCard.status !== 'APROVADA_MANUAL') {
        return NextResponse.json(
            { error: "Cartão não aprovado. Aguarde a aprovação para gerar o PDF." },
            { status: 403 }
        )
    }

    // Verificar se existe card_number e validation_token
    if (!userCard.card_number || !userCard.validation_token) {
        return NextResponse.json(
            { error: "Dados do cartão incompletos. Entre em contato com o suporte." },
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

        // Sanitizar o nome do arquivo
        const safeCardNumber = userCard.card_number.replace(/[^a-zA-Z0-9-]/g, '_')

        // Retornar o PDF como download
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="cartao-maf-${safeCardNumber}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        })
    } catch (error: any) {
        console.error("Erro ao gerar PDF:", error)
        console.error("Stack:", error?.stack)
        console.error("Message:", error?.message)
        return NextResponse.json(
            { 
                error: "Erro ao gerar o PDF do cartão",
                details: error?.message || 'Erro desconhecido'
            },
            { status: 500 }
        )
    }
}
