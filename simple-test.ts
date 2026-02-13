import { createTextImage } from './lib/pdf-generator.ts'

const simpleTest = async () => {
    const { default: sharp } = await import('sharp')

    // Criar fundo vermelho sólido (maior)
    const background = await sharp({
        create: {
            width: 500,
            height: 300,
            channels: 3,
            background: { r: 255, g: 0, b: 0 } // Vermelho
        }
    }).png().toBuffer()

    // Criar imagem de texto branco
    const textBuffer = await createTextImage('TESTE DE TEXTO', { fontSize: 48, color: 'white', fontWeight: 'bold' })

    // Compor: fundo + texto
    const result = await sharp(background)
        .composite([{
            input: textBuffer,
            top: 50,
            left: 50
        }])
        .png()
        .toBuffer()

    // Salvar
    const fs = await import('fs')
    const path = await import('path')
    fs.writeFileSync(path.join(process.cwd(), 'simple-test.png'), result)
    console.log('✅ Teste simples salvo em simple-test.png')
}

simpleTest()