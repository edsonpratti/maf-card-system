import sharp from "sharp"
import { createCanvas } from "canvas"

// Função simples para criar texto grande e visível
async function createBigText() {
    const canvas = createCanvas(600, 100)
    const ctx = canvas.getContext('2d')

    ctx.font = 'bold 72px Arial'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Fundo branco sólido
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Texto preto
    ctx.fillStyle = 'black'
    ctx.fillText('TEXTO VISÍVEL', canvas.width / 2, canvas.height / 2)

    return canvas.toBuffer('image/png')
}

async function testVeryVisibleText() {
    try {
        console.log('🎨 Criando teste com texto muito visível...')

        const width = 1063
        const height = 591

        // Fundo azul sólido
        let baseImage = sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 64, g: 128, b: 255, alpha: 255 }
            }
        })

        // Criar texto grande
        const textBuffer = await createBigText()

        // Colocar bem no centro
        const result = await baseImage
            .composite([{
                input: textBuffer,
                top: Math.floor(height / 2 - 50),
                left: Math.floor(width / 2 - 300),
                blend: 'screen' // Deve fazer texto branco aparecer sobre azul
            }])
            .png()
            .toFile('very-visible-test.png')

        console.log('✅ Teste criado! Arquivo: very-visible-test.png')

        // Também salvar apenas o texto para verificar
        const textOnly = await sharp(textBuffer).png().toFile('text-only.png')
        console.log('✅ Texto isolado salvo: text-only.png')

    } catch (error) {
        console.error('❌ Erro:', error)
    }
}

testVeryVisibleText()