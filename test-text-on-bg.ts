import sharp from "sharp"
import fs from "fs"
import path from "path"

async function testTextOnBackgroundOnly() {
    try {
        console.log('🎨 Teste: apenas fundo personalizado + texto (sem retângulo)...')

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

        // Texto simples e grande DIRETAMENTE sobre o fundo
        const svgText = Buffer.from(`
            <svg width="600" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect width="600" height="100" fill="rgba(0,0,0,0.8)" />
                <text x="10" y="60" font-family="Arial" font-size="48" font-weight="bold" fill="white">TEXTO DIRETO</text>
            </svg>
        `)

        // Aplicar texto
        const result = await baseImage
            .composite([{
                input: svgText,
                top: 200,
                left: 200,
                blend: 'over'
            }])
            .png()
            .toFile('text-on-background-only.png')

        console.log('✅ Teste concluído! Arquivo: text-on-background-only.png')

    } catch (error) {
        console.error('❌ Erro:', error)
    }
}

testTextOnBackgroundOnly()