import { generateCardPNG } from '../lib/pdf-generator'
import * as fs from 'fs'
import * as path from 'path'

async function testCardGeneration() {
    try {
        console.log('🧪 Testando geração de cartão com fonte Montserrat...')

        const testData = {
            name: 'João Silva Santos',
            cpf: '12345678901',
            cardNumber: 'C54321',
            qrToken: 'test-token-123',
            photoPath: null,
            certificationDate: '2024-01-15T00:00:00Z'
        }

        console.log('📝 Dados de teste:', testData)

        const cardBuffer = await generateCardPNG(testData)

        // Salvar o cartão gerado para verificação
        const outputPath = path.join(process.cwd(), 'test-card-montserrat.png')
        fs.writeFileSync(outputPath, cardBuffer)

        console.log('✅ Cartão gerado com sucesso!')
        console.log(`📁 Arquivo salvo em: ${outputPath}`)
        console.log(`📏 Tamanho do arquivo: ${cardBuffer.length} bytes`)

    } catch (error) {
        console.error('❌ Erro ao gerar cartão:', error)
        process.exit(1)
    }
}

testCardGeneration()