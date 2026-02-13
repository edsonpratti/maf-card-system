import { generateCardPNG } from '../lib/pdf-generator'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function generateTestCardPDF(data: {
    name: string
    cpf: string
    cardNumber: string
    qrToken: string
    certificationDate?: string | null
    photoPath?: string | null
}) {
    try {
        const pdfDoc = await PDFDocument.create()
        // Tamanho de cartão de crédito: 85.6mm x 53.98mm = ~243 x 153 pontos
        const page = pdfDoc.addPage([243, 153])
        const { width, height } = page.getSize()

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

        // DESIGN: Cartão dividido em duas seções
        // Esquerda (~55%): Fundo branco com informações em preto
        // Direita (~45%): Gradiente azul-turquesa

        // Seção esquerda - Fundo branco
        const leftSectionWidth = width * 0.55
        page.drawRectangle({
            x: 0,
            y: 0,
            width: leftSectionWidth,
            height,
            color: rgb(1, 1, 1), // Branco
        })

        // Seção direita - Gradiente azul escuro para turquesa
        const gradientSteps = 100
        for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / gradientSteps
            // Cores: azul escuro (0.16, 0.29, 0.36) → turquesa/ciano (0.4, 0.73, 0.73)
            const r = 0.16 + ratio * 0.24
            const g = 0.29 + ratio * 0.44
            const b = 0.36 + ratio * 0.37

            page.drawRectangle({
                x: leftSectionWidth,
                y: height - (i + 1) * (height / gradientSteps),
                width: width - leftSectionWidth,
                height: height / gradientSteps + 1,
                color: rgb(r, g, b),
            })
        }

        // Logo "maf" no canto superior direito em branco
        page.drawText('maf', {
            x: width - 38,
            y: height - 20,
            size: 16,
            font: fontRegular,
            color: rgb(1, 1, 1),
        })

        // Foto circular pequena como avatar, centralizada horizontal e verticalmente
        if (data.photoPath) {
            // Para teste, vamos criar uma imagem simples (círculo colorido)
            // Em produção, isso seria baixado do Supabase
            const photoSize = 50
            const photoX = width / 2 - photoSize / 2
            const photoY = height / 2 - photoSize / 2

            // Círculo branco de fundo (borda)
            page.drawCircle({
                x: photoX + photoSize / 2,
                y: photoY + photoSize / 2,
                size: photoSize / 2 + 3,
                color: rgb(1, 1, 1),
            })

            // Círculo azul para simular foto (já circular por natureza)
            page.drawCircle({
                x: photoX + photoSize / 2,
                y: photoY + photoSize / 2,
                size: photoSize / 2,
                color: rgb(0.2, 0.5, 0.8),
            })
        }

        // Nome completo à esquerda (em preto sobre fundo branco)
        const nameSize = 15
        page.drawText(data.name, {
            x: 25,
            y: height / 2 + 30,
            size: nameSize,
            font: fontBold,
            color: rgb(0, 0, 0),
        })

        // "Habilitada desde" abaixo do nome (em cinza)
        if (data.certificationDate) {
            const certDate = new Date(data.certificationDate)
            const year = certDate.getFullYear()
            const dateText = `Habilitada desde ${year}`

            page.drawText(dateText, {
                x: 25,
                y: height / 2 + 12,
                size: 9,
                font: fontRegular,
                color: rgb(0.6, 0.6, 0.6),
            })
        }

        // CPF abaixo da data (em preto)
        page.drawText(data.cpf, {
            x: 25,
            y: height / 2 - 6,
            size: 12,
            font: fontRegular,
            color: rgb(0, 0, 0),
        })

        // "Código único:" na parte inferior esquerda
        page.drawText('Código único:', {
            x: 25,
            y: 35,
            size: 7,
            font: fontBold,
            color: rgb(0, 0, 0),
        })

        // Código único abaixo (em cinza)
        page.drawText(data.cardNumber, {
            x: 25,
            y: 22,
            size: 8,
            font: fontRegular,
            color: rgb(0.5, 0.5, 0.5),
        })

        // QR Code no canto inferior direito com borda branca
        try {
            const baseUrl = 'https://maf-card-system.vercel.app'
            const qrBuffer = await QRCode.toBuffer(
                `${baseUrl}/validar/${data.qrToken}`,
                {
                    width: 200,
                    margin: 1,
                    errorCorrectionLevel: 'M',
                    type: 'png'
                }
            )
            const qrImage = await pdfDoc.embedPng(qrBuffer)

            // QR Code com borda branca
            const qrSize = 48
            const qrX = width - qrSize - 15
            const qrY = 15

            // Fundo branco para o QR Code
            page.drawRectangle({
                x: qrX - 4,
                y: qrY - 4,
                width: qrSize + 8,
                height: qrSize + 8,
                color: rgb(1, 1, 1),
            })

            page.drawImage(qrImage, {
                x: qrX,
                y: qrY,
                width: qrSize,
                height: qrSize,
            })
        } catch (qrError) {
            console.error('Erro ao gerar QR Code:', qrError)
        }

        // Serializar o PDF
        const pdfBytes = await pdfDoc.save()
        return Buffer.from(pdfBytes)
    } catch (error) {
        console.error('Erro em generateTestCardPDF:', error)
        throw error
    }
}

async function testCardGeneration() {
    console.log('🎨 Testando geração de carteirinha com novo design...')

    try {
        const testData = {
            name: 'Mariana Costa',
            cpf: '000.000.000-00',
            cardNumber: 'MAF-MLF8M9GR-4XQHZR',
            qrToken: 'test-token-123456',
            certificationDate: '2020-01-01',
            photoPath: null // Sem foto para teste
        }

        const pngBuffer = await generateCardPNG(testData)

        const outputPath = join(process.cwd(), 'test-card-output.png')
        writeFileSync(outputPath, pngBuffer)

        console.log('✅ PNG gerado com sucesso!')
        console.log(`📄 Arquivo salvo em: ${outputPath}`)
        console.log(`📊 Tamanho: ${(pngBuffer.length / 1024).toFixed(2)} KB`)
        console.log('\n🔍 Abra o arquivo para verificar:')
        console.log('   - Baseado exatamente no modelo1.jpeg')
        console.log('   - Foto circular adicionada dinamicamente (não incluída no teste)')
        console.log('   - QR Code adicionado no canto inferior direito')
        console.log('   - Todos os textos e layout fixos do modelo preservados')

    } catch (error) {
        console.error('❌ Erro ao gerar PNG:', error)
        process.exit(1)
    }
}

testCardGeneration()
