import sharp from "sharp"
import { createCanvas } from "canvas"

// Função auxiliar para gerar texto como imagem
async function createTextImage(text: string, options: { fontSize: number; color?: string; fontWeight?: string }) {
    try {
        console.log(`🔍 Criando imagem para texto: "${text}"`)

        // Criar canvas para medir e renderizar o texto
        const canvas = createCanvas(800, 200)
        const ctx = canvas.getContext('2d')

        // Configurar fonte
        const fontWeight = options.fontWeight === 'bold' ? 'bold' : 'normal'
        ctx.font = `${fontWeight} ${options.fontSize}px Arial, sans-serif`
        ctx.fillStyle = options.color || 'white'

        // Medir o texto
        const metrics = ctx.measureText(text)
        const textWidth = Math.ceil(metrics.width)
        const textHeight = options.fontSize + 10

        console.log(`📏 Dimensões calculadas: ${textWidth}x${textHeight} para "${text}"`)

        // Ajustar tamanho do canvas
        canvas.width = textWidth + 20
        canvas.height = textHeight + 20

        // Limpar e reconfigurar
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.font = `${fontWeight} ${options.fontSize}px Arial, sans-serif`
        ctx.textBaseline = 'top'

        // Renderizar fundo branco sólido
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)' // Branco sólido
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Renderizar texto preto sobre fundo branco
        ctx.fillStyle = 'rgba(0, 0, 0, 1.0)' // Preto
        ctx.fillText(text, 10, 10)

        // Converter para buffer
        const buffer = canvas.toBuffer('image/png')
        console.log(`✅ PNG criado para "${text}": ${buffer.length} bytes`)
        return buffer
    } catch (error) {
        console.error(`❌ Erro ao criar imagem de texto "${text}":`, error)
        throw error
    }
}

async function testSimpleComposition() {
    try {
        console.log('🎨 Testando composição simples...')

        // Criar fundo semi-transparente
        const background = sharp({
            create: {
                width: 400,
                height: 300,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 128 } // Fundo preto semi-transparente
            }
        })

        // Criar texto
        const textBuffer = await createTextImage('TESTE DE TEXTO', { fontSize: 32, color: 'white', fontWeight: 'bold' })

        // Composição: fundo primeiro, depois texto
        const result = await background
            .composite([{
                input: textBuffer,
                top: 50,
                left: 50,
                blend: 'over'
            }])
            .png()
            .toFile('simple-test.png')

        console.log('✅ Teste simples concluído! Arquivo: simple-test.png')

    } catch (error) {
        console.error('❌ Erro no teste simples:', error)
    }
}

testSimpleComposition()