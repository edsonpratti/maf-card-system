import sharp from "sharp"

async function testDirectText() {
    try {
        console.log('🎨 Testando texto direto com SVG...')

        const width = 1063
        const height = 591

        // Carregar fundo personalizado
        const fs = await import('fs')
        const path = await import('path')
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
                    background: { r: 0, g: 0, b: 0, alpha: 200 }
                }
            },
            top: 50,
            left: 50
        }])

        // Adicionar texto DIRETAMENTE como SVG (sem canvas)
        const svgText1 = Buffer.from(`
            <svg width="400" height="50">
                <text x="10" y="35" font-family="Arial" font-size="28" font-weight="bold" fill="white">Código único:</text>
            </svg>
        `)

        const svgText2 = Buffer.from(`
            <svg width="400" height="50">
                <text x="10" y="35" font-family="Arial" font-size="32" fill="white">MAF-MLF8M9GR-4XQHZR</text>
            </svg>
        `)

        const svgText3 = Buffer.from(`
            <svg width="400" height="60">
                <text x="10" y="40" font-family="Arial" font-size="48" font-weight="bold" fill="white">Mariana Costa</text>
            </svg>
        `)

        baseImage = baseImage.composite([
            {
                input: svgText1,
                top: 100,
                left: 100
            },
            {
                input: svgText2,
                top: 140,
                left: 100
            },
            {
                input: svgText3,
                top: 200,
                left: 100
            }
        ])

        // Salvar
        await baseImage.png().toFile('direct-text-test.png')

        console.log('✅ Teste com texto SVG direto concluído! Arquivo: direct-text-test.png')

    } catch (error) {
        console.error('❌ Erro:', error)
    }
}

testDirectText()