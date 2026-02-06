import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"

export async function generateCardPDF(data: {
    name: string
    cpf: string
    cardNumber: string
    qrToken: string
}) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 400])
    const { width, height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Draw background (Mocking a design with colors)
    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.9, 0.95, 1),
    })

    // Draw Header
    page.drawText('Carteirinha de Habilitada MAF', {
        x: 50,
        y: height - 60,
        size: 28,
        font,
        color: rgb(0, 0, 0.6),
    })

    // Draw Name
    page.drawText(`Nome: ${data.name}`, {
        x: 50,
        y: height - 120,
        size: 18,
        font,
        color: rgb(0, 0, 0),
    })

    // Draw CPF
    page.drawText(`CPF: ${data.cpf}`, {
        x: 50,
        y: height - 150,
        size: 18,
        font,
        color: rgb(0, 0, 0),
    })

    // Draw Card Number
    page.drawText(`Carteira Nº: ${data.cardNumber}`, {
        x: 50,
        y: height - 180,
        size: 18,
        font,
        color: rgb(0, 0, 0),
    })

    // Generate QR Code
    // Use toBuffer for server-side generation
    const qrBuffer = await QRCode.toBuffer(
        `${process.env.NEXT_PUBLIC_APP_URL}/validar/${data.qrToken}`
    )
    const qrImage = await pdfDoc.embedPng(qrBuffer)

    page.drawImage(qrImage, {
        x: width - 150,
        y: 50,
        width: 100,
        height: 100,
    })

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
}
