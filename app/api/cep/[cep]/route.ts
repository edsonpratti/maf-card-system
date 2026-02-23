import { NextRequest, NextResponse } from "next/server"

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ cep: string }> }
) {
    const { cep } = await params
    const cleanCep = cep.replace(/\D/g, "")

    if (cleanCep.length !== 8) {
        return NextResponse.json({ erro: true, message: "CEP inválido" }, { status: 400 })
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
            next: { revalidate: 86400 }, // cache for 24h
        })

        if (!response.ok) {
            return NextResponse.json({ erro: true, message: "Falha ao consultar ViaCEP" }, { status: 502 })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ erro: true, message: "Erro ao buscar CEP" }, { status: 502 })
    }
}
