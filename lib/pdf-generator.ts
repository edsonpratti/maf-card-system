import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"

export async function generateCardPDF(data: {
    name: string
    cpf: string
    cardNumber: string
    qrToken: string
}) {
    try {
        const pdfDoc = await PDFDocument.create()
        // Tamanho de cartão de crédito: 85.6mm x 53.98mm = ~243 x 153 pontos
        const page = pdfDoc.addPage([243, 153])
        const { width, height } = page.getSize()

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

        // Gradiente simulado: preto no topo, transição para laranja/dourado
        // Como pdf-lib não suporta gradientes nativamente, vamos criar camadas de retângulos
        const gradientSteps = 50
        for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / gradientSteps
            // Transição de preto (0,0,0) para laranja/dourado (0.95, 0.6, 0.2)
            const r = 0 + ratio * 0.95
            const g = 0 + ratio * 0.6
            const b = 0 + ratio * 0.2
            
            page.drawRectangle({
                x: 0,
                y: height - (i + 1) * (height / gradientSteps),
                width,
                height: height / gradientSteps + 1,
                color: rgb(r, g, b),
            })
        }

        // Logo "MAF" no canto superior esquerdo (simplificado como texto)
        page.drawText('MAF', {
            x: 10,
            y: height - 20,
            size: 12,
            font: fontBold,
            color: rgb(1, 1, 1),
        })

        // "LEVEL" no canto superior direito
        page.drawText('LEVEL', {
            x: width - 50,
            y: height - 12,
            size: 6,
            font: fontRegular,
            color: rgb(0.7, 0.7, 0.7),
        })

        // "Habilitada MAF" no canto superior direito
        page.drawText('Habilitada MAF', {
            x: width - 80,
            y: height - 22,
            size: 8,
            font: fontBold,
            color: rgb(1, 1, 1),
        })

        // Nome completo no centro (destaque)
        const nameSize = 14
        const nameWidth = fontBold.widthOfTextAtSize(data.name, nameSize)
        page.drawText(data.name, {
            x: Math.max(10, (width - nameWidth) / 2),
            y: height / 2 + 10,
            size: nameSize,
            font: fontBold,
            color: rgb(1, 1, 1),
        })

        // CPF abaixo do nome
        const cpfText = `CPF: ${data.cpf}`
        page.drawText(cpfText, {
            x: 10,
            y: height / 2 - 10,
            size: 8,
            font: fontRegular,
            color: rgb(0.9, 0.9, 0.9),
        })

        // "MINT NUMBER" e código único na parte inferior
        page.drawText('CÓDIGO ÚNICO', {
            x: 10,
            y: 30,
            size: 6,
            font: fontRegular,
            color: rgb(0.7, 0.7, 0.7),
        })

        page.drawText(data.cardNumber, {
            x: 10,
            y: 18,
            size: 10,
            font: fontBold,
            color: rgb(1, 1, 1),
        })

        // QR Code no canto inferior direito (menor)
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maf-card-system.vercel.app'
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

            page.drawImage(qrImage, {
                x: width - 45,
                y: 5,
                width: 40,
                height: 40,
            })
        } catch (qrError) {
            console.error('Erro ao gerar QR Code:', qrError)
            // Continuar sem QR Code se houver erro
        }

        // Serializar o PDF
        const pdfBytes = await pdfDoc.save()
        return Buffer.from(pdfBytes)
    } catch (error) {
        console.error('Erro em generateCardPDF:', error)
        throw error
    }
}
