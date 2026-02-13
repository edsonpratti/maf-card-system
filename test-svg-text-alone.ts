import sharp from "sharp"

async function testSVGTextStandalone() {
    try {
        // SVG simples
        const svg = Buffer.from(`
            <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="100" fill="blue" />
                <text x="10" y="60" font-family="Arial" font-size="48" font-weight="bold" fill="white">TEXTO SVG</text>
            </svg>
        `)

        // Converter SVG para PNG
        await sharp(svg)
            .png()
            .toFile('svg-text-alone.png')

        console.log('✅ Teste SVG standalone concluído! Arquivo: svg-text-alone.png')
    } catch (error) {
        console.error('❌ Erro:', error)
    }
}

testSVGTextStandalone()