import { generateCardPNG } from '../lib/pdf-generator'
import * as fs from 'fs'
import * as path from 'path'

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })

async function testCardVercel() {
    try {
        // Simular ambiente Vercel
        process.env.VERCEL = '1'

        console.log('🧪 Testando geração de cartão simulando Vercel...')
        console.log('VERCEL:', process.env.VERCEL)

        const testData = {
            name: 'João Silva Santos',
            cpf: '12345678901',
            cardNumber: 'B98765',
            qrToken: 'test-token-123',
            photoPath: null, // Teste sem foto
            certificationDate: '2024-01-15T00:00:00Z'
        }

        console.log('📝 Dados de teste:', testData)

        const cardBuffer = await generateCardPNG(testData)

        // Salvar o cartão gerado para verificação
        const outputPath = path.join(process.cwd(), 'test-card-vercel.png')
        fs.writeFileSync(outputPath, cardBuffer)

        console.log('✅ Cartão gerado com sucesso!')
        console.log(`📁 Arquivo salvo em: ${outputPath}`)
        console.log(`📏 Tamanho do arquivo: ${cardBuffer.length} bytes`)

    } catch (error) {
        console.error('❌ Erro ao gerar cartão:', error)
        process.exit(1)
    }
}

testCardVercel()