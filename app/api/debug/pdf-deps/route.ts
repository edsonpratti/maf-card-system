import { NextResponse } from "next/server"
import { verifyAdminAccess, handleAuthError } from "@/lib/auth"

export async function GET() {
    try {
        // Verificar autenticação de admin - apenas admins podem ver informações de debug
        await verifyAdminAccess();
        
        // Em produção, retornar informações mínimas
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({
                status: 'ok',
                message: 'Debug info only available in development mode'
            })
        }
        
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
    } catch (error) {
        console.error('Error in GET /api/debug/pdf-deps:', error);
        return handleAuthError(error);
    }
}
