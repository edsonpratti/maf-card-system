import { createTextWithBackground } from './lib/pdf-generator'
import QRCode from 'qrcode'

const testWithSolidBackground = async () => {
    const { default: sharp } = await import('sharp')

    const testData = {
        name: 'Mariana Costa',
        cpf: '000.000.000-00',
        cardNumber: 'MAF-MLF8M9GR-4XQHZR',
        qrToken: 'test-token-123',
        certificationDate: '2019-01-01'
    }

    try {
        // Dimensões maiores para melhor qualidade: 1063 × 591 pixels @ 72 DPI
        const width = 1063
        const height = 591
        const leftSectionWidth = width * 0.55

        // Usar fundo sólido azul em vez da imagem
        let baseImage = sharp({
            create: {
                width: width,
                height: height,
                channels: 3,
                background: { r: 100, g: 149, b: 237 } // Azul
            }
        })

        // Adicionar logo "maf"
        baseImage = baseImage.composite([{
            input: Buffer.from(`
                <svg width="200" height="80">
                    <text x="0" y="60" font-family="Arial" font-size="64" fill="white">maf</text>
                </svg>
            `),
            top: 40,
            left: width - 200
        }])

        // Adicionar fundo semi-transparente para os textos
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

        // Adicionar textos como imagens separadas
        const labelTextBuffer = await createTextWithBackground('Código único:', { fontSize: 28, fontWeight: 'bold' })
        console.log('🎨 Compondo label...')
        baseImage = baseImage.composite([{
            input: labelTextBuffer,
            top: 80,
            left: 80
        }])
        console.log('✅ Label composto')

        const cardTextBuffer = await createTextWithBackground(testData.cardNumber, { fontSize: 32 })
        console.log('🎨 Compondo card number...')
        baseImage = baseImage.composite([{
            input: cardTextBuffer,
            top: 120,
            left: 80
        }])
        console.log('✅ Card number composto')

        const nameTextBuffer = await createTextWithBackground(testData.name, { fontSize: 48, fontWeight: 'bold' })
        console.log('🎨 Compondo nome...')
        baseImage = baseImage.composite([{
            input: nameTextBuffer,
            top: height - 250,
            left: 80
        }])
        console.log('✅ Nome composto')

        const cpfTextBuffer = await createTextWithBackground(testData.cpf, { fontSize: 36 })
        console.log('🎨 Compondo CPF...')
        baseImage = baseImage.composite([{
            input: cpfTextBuffer,
            top: height - 190,
            left: 80
        }])
        console.log('✅ CPF composto')

        if (testData.certificationDate) {
            const dateText = `Habilitada desde ${new Date(testData.certificationDate).getFullYear()}`
            const dateTextBuffer = await createTextWithBackground(dateText, { fontSize: 24 })
            console.log('🎨 Compondo data...')
            baseImage = baseImage.composite([{
                input: dateTextBuffer,
                top: height - 130,
                left: 80
            }])
            console.log('✅ Data composta')
        }

        // Gerar QR Code
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maf-card-system.vercel.app'
            const qrBuffer = await QRCode.toBuffer(`${baseUrl}/validar/${testData.qrToken}`, {
                width: 192,
                margin: 2,
                errorCorrectionLevel: 'M',
                type: 'png'
            })

            baseImage = baseImage.composite([{
                input: qrBuffer,
                top: height - 232,
                left: width - 232
            }])
        } catch (qrError) {
            console.error('Erro ao gerar QR Code:', qrError)
        }

        // Exportar como PNG
        const pngBuffer = await baseImage.png().toBuffer()

        // Salvar arquivo
        const fs = await import('fs')
        const path = await import('path')
        fs.writeFileSync(path.join(process.cwd(), 'test-solid-background.png'), pngBuffer)
        console.log('✅ Teste com fundo sólido salvo em test-solid-background.png')

    } catch (error) {
        console.error('❌ Erro no teste com fundo sólido:', error)
        throw error
    }
}

testWithSolidBackground()