import { generateCardPNG } from '../lib/pdf-generator'
import * as fs from 'fs'
import * as path from 'path'

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })

async function createTestCard() {
    try {
        console.log('🧪 Criando cartão de teste...')

        const testData = {
            name: 'João Silva Santos',
            cpf: '12345678901',
            cardNumber: 'A12345',
            qrToken: 'test-token-123',
            photoPath: 'fototeste.jpeg', // Usar foto de teste local
            certificationDate: '2024-01-15T00:00:00Z'
        }

        console.log('📝 Dados do cartão:', testData)

        const cardBuffer = await generateCardPNG(testData)

        // Salvar o cartão
        const outputPath = path.join(process.cwd(), 'cartao-teste.png')
        fs.writeFileSync(outputPath, cardBuffer)

        console.log('✅ Cartão criado com sucesso!')
        console.log(`📁 Salvo em: ${outputPath}`)
        console.log(`📏 Tamanho: ${cardBuffer.length} bytes`)

    } catch (error) {
        console.error('❌ Erro ao criar cartão:', error)
        process.exit(1)
    }
}

createTestCard()