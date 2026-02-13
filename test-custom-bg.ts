import sharp from "sharp"
import { createCanvas } from "canvas"
import fs from "fs"
import path from "path"

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

async function testWithCustomBackground() {
    try {
        console.log('🎨 Testando com fundo personalizado...')

        const width = 1063
        const height = 591

        // Carregar fundo personalizado
        const fundoPath = path.join(process.cwd(), 'public', 'padrao_fundo_carteira.png')
        const fundoBuffer = fs.readFileSync(fundoPath)

        // Fundo personalizado
        let baseImage = sharp(fundoBuffer)
            .resize(width, height, {
                fit: 'cover',
                position: 'center',
                withoutEnlargement: false
            })

        // Adicionar fundo semi-transparente
        baseImage = baseImage.composite([{
            input: {
                create: {
                    width: 400,
                    height: height - 100,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 128 } // Fundo preto semi-transparente
                }
            },
            top: 50,
            left: 50
        }])

        // Adicionar texto
        const textBuffer = await createTextImage('TEXTO TESTE VISÍVEL', { fontSize: 32, color: 'white', fontWeight: 'bold' })

        const result = await baseImage
            .composite([{
                input: textBuffer,
                top: 100,
                left: 100,
                blend: 'over'
            }])
            .png()
            .toFile('test-custom-bg.png')

        console.log('✅ Teste com fundo personalizado concluído! Arquivo: test-custom-bg.png')

    } catch (error) {
        console.error('❌ Erro no teste com fundo personalizado:', error)
    }
}

testWithCustomBackground()