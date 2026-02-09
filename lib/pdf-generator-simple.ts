import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export async function generateSimpleCardPDF(data: {
    name: string
    cpf: string
    cardNumber: string
    qrToken: string
}) {
    try {
        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([243, 153])
        const { width, height } = page.getSize()

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

        // Fundo preto
        page.drawRectangle({
            x: 0,
            y: 0,
            width,
            height,
            color: rgb(0.1, 0.1, 0.1),
        })

        // Logo MAF
        page.drawText('MAF', {
            x: 10,
            y: height - 20,
            size: 12,
            font: fontBold,
            color: rgb(1, 1, 1),
        })

        // Badge
        page.drawText('Habilitada MAF', {
            x: width - 80,
            y: height - 22,
            size: 8,
            font: fontBold,
            color: rgb(1, 1, 1),
        })

        // Nome
        page.drawText(data.name, {
            x: 10,
            y: height / 2 + 10,
            size: 12,
            font: fontBold,
            color: rgb(1, 1, 1),
        })

        // CPF
        page.drawText(`CPF: ${data.cpf}`, {
            x: 10,
            y: height / 2 - 10,
            size: 8,
            font: fontRegular,
            color: rgb(0.9, 0.9, 0.9),
        })

        // Código único
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

        const pdfBytes = await pdfDoc.save()
        return Buffer.from(pdfBytes)
    } catch (error) {
        console.error('Erro em generateSimpleCardPDF:', error)
        throw error
    }
}
