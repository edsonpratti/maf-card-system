import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Testar se as dependências estão disponíveis
        const testResults = {
            pdfLib: false,
            qrcode: false,
            buffer: false,
            timestamp: new Date().toISOString()
        }

        try {
            const { PDFDocument } = await import('pdf-lib')
            testResults.pdfLib = !!PDFDocument
        } catch (e: any) {
            testResults.pdfLib = e.message
        }

        try {
            const QRCode = await import('qrcode')
            testResults.qrcode = !!QRCode
        } catch (e: any) {
            testResults.qrcode = e.message
        }

        try {
            const buf = Buffer.from('test')
            testResults.buffer = buf.length === 4
        } catch (e: any) {
            testResults.buffer = e.message
        }

        return NextResponse.json({
            status: 'ok',
            environment: {
                nodeEnv: process.env.NODE_ENV,
                hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
                runtime: process.env.VERCEL ? 'vercel' : 'local'
            },
            dependencies: testResults
        })
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
