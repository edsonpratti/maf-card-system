import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateCardPDF } from "@/lib/pdf-generator"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // Gerar card_number e validation_token se não existirem
    let cardNumber = userCard.card_number
    let validationToken = userCard.validation_token
    
    if (!cardNumber || !validationToken) {
        console.log(`[PDF] Gerando credenciais para cartão ${id}`)
        
        // Gerar card_number
        if (!cardNumber) {
            const timestamp = Date.now().toString(36)
            const randomPart = Math.random().toString(36).substring(2, 8)
            cardNumber = `MAF-${timestamp}-${randomPart}`.toUpperCase()
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
            console.error('[PDF] Erro ao atualizar credenciais:', updateError)
        } else {
            console.log('[PDF] Credenciais geradas e salvas com sucesso')
        }
    }

    try {
        console.log(`[PDF] Gerando PDF para cartão ${id}`)
        
        const pdfBuffer = await generateCardPDF({
            name: userCard.name,
            cpf: userCard.cpf,
            cardNumber: cardNumber,
            qrToken: validationToken,
        })
        
        console.log(`[PDF] PDF gerado com sucesso. Tamanho: ${pdfBuffer.length} bytes`)

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
        console.error("[PDF] Erro ao gerar PDF:", error)
        console.error("[PDF] Stack:", error?.stack)
        console.error("[PDF] Message:", error?.message)
        return NextResponse.json(
            { 
                error: "Erro ao gerar o PDF do cartão",
                details: error?.message || 'Erro desconhecido',
                stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
            },
            { status: 500 }
        )
    }
}
