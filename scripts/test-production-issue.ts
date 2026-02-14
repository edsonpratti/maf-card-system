import fs from 'fs'
import path from 'path'
import { createCanvas } from 'canvas'

// Função auxiliar para formatar CPF (cópia da função original)
function formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length !== 11) {
        return cpf
    }
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

async function testCardRendering() {
    try {
        console.log('🧪 Testando renderização do cartão sem Supabase...')

        // Dimensões do cartão: 1063 × 591 pixels
        const width = 1063
        const height = 591

        // Criar canvas
        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext('2d')

        // Fundo branco para teste
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, width, height)

        // Dados que simulam o que vem do banco em produção
        const testData = {
            name: 'João Silva Santos',
            cpf: '12345678900', // CPF sem formatação como vem do banco
            cardNumber: 'MAF-123-ABC',
            qrToken: 'test-token-123456789',
            photoPath: null,
            certificationDate: '2024-01-15T10:30:00Z'
        }

        console.log('📊 Dados de teste:', testData)

        // Configurar texto
        ctx.fillStyle = 'black'
        ctx.textAlign = 'left'

        // Calcular posições
        const nameToDateSpacing = 30
        const dateToCpfSpacing = 45
        const centerY = height / 2

        const nameY = centerY - (nameToDateSpacing / 2) - dateToCpfSpacing
        const dateY = nameY + nameToDateSpacing
        const cpfY = dateY + dateToCpfSpacing

        // Renderizar nome
        ctx.font = 'bold 40px Arial'
        const displayName = testData.name && testData.name.trim() ? testData.name : 'Nome não informado'
        ctx.fillText(displayName, 50, Math.round(nameY))
        console.log(`✅ Nome renderizado: "${displayName}"`)

        // Renderizar data
        ctx.font = '15px Arial'
        const formattedDate = testData.certificationDate
            ? new Date(testData.certificationDate).toLocaleDateString('pt-BR')
            : 'Data não informada'
        ctx.fillText(`Habilitado(a) desde ${formattedDate}`, 50, Math.round(dateY))
        console.log(`✅ Data renderizada: "Habilitado(a) desde ${formattedDate}"`)

        // Renderizar CPF
        ctx.font = '25px Arial'
        const formattedCPF = testData.cpf && testData.cpf.trim() ? formatCPF(testData.cpf) : 'CPF não informado'
        ctx.fillText(formattedCPF, 50, Math.round(cpfY))
        console.log(`✅ CPF renderizado: "${formattedCPF}"`)

        // Salvar arquivo
        const pngBuffer = canvas.toBuffer('image/png')
        const outputPath = path.join(process.cwd(), 'test-production-rendering.png')
        fs.writeFileSync(outputPath, pngBuffer)

        console.log(`✅ Teste concluído! Arquivo salvo em: ${outputPath}`)
        console.log(`📏 Tamanho: ${pngBuffer.length} bytes`)

    } catch (error) {
        console.error('❌ Erro no teste:', error)
        process.exit(1)
    }
}

testCardRendering()