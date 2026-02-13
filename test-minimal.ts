import sharp from "sharp"
import fs from "fs"
import path from "path"

async function testMinimalComposition() {
    try {
        console.log('🎨 Teste mínimo: apenas fundo + texto...')

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

        // Fundo semi-transparente
        baseImage = baseImage.composite([{
            input: {
                create: {
                    width: 400,
                    height: 100,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 200 }
                }
            },
            top: 100,
            left: 100
        }])

        // Texto simples e grande
        const svgText = Buffer.from(`
            <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
                <text x="10" y="60" font-family="Arial" font-size="48" font-weight="bold" fill="white">TEXTO TESTE</text>
            </svg>
        `)

        // Aplicar texto
        const result = await baseImage
            .composite([{
                input: svgText,
                top: 100,
                left: 100,
                blend: 'over'
            }])
            .png()
            .toFile('minimal-test.png')

        console.log('✅ Teste mínimo concluído! Arquivo: minimal-test.png')

    } catch (error) {
        console.error('❌ Erro:', error)
    }
}

testMinimalComposition()