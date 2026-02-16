import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"
import sharp from "sharp"

// Função auxiliar para formatar CPF
function formatCPF(cpf: string): string {
    // Remove todos os caracteres não numéricos
    const cleaned = cpf.replace(/\D/g, '')

    // Verifica se tem 11 dígitos
    if (cleaned.length !== 11) {
        return cpf // Retorna como está se não for válido
    }

    // Aplica a formatação: XXX.XXX.XXX-XX
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export async function generateCardPNG(data: {
    name: string
    cpf: string
    cardNumber: string
    qrToken: string
    photoPath?: string | null
    certificationDate?: string | null
}) {
    try {
        const fs = await import('fs')
        const path = await import('path')

        console.log('ℹ️ Usando abordagem 100% Sharp (sem Canvas)')

        // Dimensões do cartão: 1063 × 591 pixels
        const width = 1063
        const height = 591

        // Carregar fontes TTF como base64
        const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'montserrat-regular.ttf')
        const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'montserrat-bold.ttf')
        const fontRegularBase64 = fs.readFileSync(fontRegularPath).toString('base64')
        const fontBoldBase64 = fs.readFileSync(fontBoldPath).toString('base64')

        // Preparar imagem de fundo como base
        const backgroundPath = path.join(process.cwd(), 'public', 'padrao_fundo_carteira.png')
        let base = sharp(backgroundPath).resize(width, height)

        // Array de composições (overlays)
        const composites: any[] = []

        // Função auxiliar para criar SVG de texto com fonte embutida
        function createTextSVG(
            text: string,
            fontSize: number,
            fontWeight: 'normal' | 'bold',
            color: string,
            options?: { width?: number; align?: 'left' | 'right' }
        ): string {
            const fontBase64 = fontWeight === 'bold' ? fontBoldBase64 : fontRegularBase64
            const estimatedWidth = Math.max(Math.ceil(text.length * fontSize * 0.65), fontSize * 2)
            const svgWidth = options?.width ? Math.max(options.width, estimatedWidth) : estimatedWidth
            const align = options?.align || 'left'
            const textX = align === 'right' ? svgWidth - 2 : 0
            const textAnchor = align === 'right' ? 'end' : 'start'
            const safeText = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;')
            
            return `
                <svg width="${svgWidth}" height="${fontSize + 20}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <style>
                            @font-face {
                                font-family: 'Montserrat';
                                src: url("data:font/ttf;base64,${fontBase64}") format('truetype');
                                font-weight: ${fontWeight === 'bold' ? '700' : '400'};
                            }
                        </style>
                    </defs>
                      <text x="${textX}" y="${fontSize}" 
                          font-family="Montserrat, sans-serif" 
                          font-size="${fontSize}" 
                          font-weight="${fontWeight === 'bold' ? '700' : '400'}"
                          text-anchor="${textAnchor}"
                          fill="${color}">${safeText}</text>
                </svg>
            `
        }

        // Função para quebrar texto em linhas baseado na largura máxima
        function breakTextIntoLines(text: string, maxWidth: number, fontSize: number): string[] {
            const words = text.split(' ')
            const lines: string[] = []
            let currentLine = ''

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word
                const estimatedWidth = testLine.length * fontSize * 0.6

                if (estimatedWidth <= maxWidth && currentLine) {
                    currentLine = testLine
                } else if (estimatedWidth <= maxWidth) {
                    currentLine = word
                } else {
                    if (currentLine) {
                        lines.push(currentLine)
                    }
                    currentLine = word
                }
            }

            if (currentLine) {
                lines.push(currentLine)
            }

            return lines
        }

        // Processar foto se existir
        if (data.photoPath) {
            try {
                let photoBuffer: Buffer | null = null

                // Tentar carregar foto local primeiro (para testes)
                if (data.photoPath && !data.photoPath.startsWith('http')) {
                    const localPhotoPath = path.join(process.cwd(), 'public', data.photoPath)
                    if (fs.existsSync(localPhotoPath)) {
                        photoBuffer = fs.readFileSync(localPhotoPath)
                        console.log('📸 Usando foto local:', localPhotoPath)
                    }
                }

                // Se não encontrou local, tentar Supabase
                if (!photoBuffer && data.photoPath && !data.photoPath.startsWith('http')) {
                    const { createClient } = await import('@supabase/supabase-js')
                    const supabase = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                    )

                    const { data: photoData, error } = await supabase.storage
                        .from('photos')
                        .download(data.photoPath)

                    if (photoData && !error) {
                        photoBuffer = Buffer.from(await photoData.arrayBuffer())
                        console.log('📸 Usando foto do Supabase:', data.photoPath)
                    }
                }

                if (photoBuffer) {
                    const photoSize = 260
                    const photoX = Math.round((width - photoSize) / 2)
                    const photoY = Math.round((height - photoSize) / 2)

                    // Criar máscara circular SVG
                    const circleMask = Buffer.from(`
                        <svg width="${photoSize}" height="${photoSize}">
                            <circle cx="${photoSize/2}" cy="${photoSize/2}" r="${photoSize/2}" fill="white"/>
                        </svg>
                    `)

                    // Processar foto: resize + crop cover + máscara circular
                    const circularPhoto = await sharp(photoBuffer)
                        .resize(photoSize, photoSize, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .composite([{
                            input: circleMask,
                            blend: 'dest-in'
                        }])
                        .png()
                        .toBuffer()

                    // Criar borda branca (anel SVG)
                    const whiteBorder = Buffer.from(`
                        <svg width="${photoSize + 20}" height="${photoSize + 20}">
                            <circle cx="${(photoSize + 20)/2}" cy="${(photoSize + 20)/2}" 
                                    r="${photoSize/2 + 5}" 
                                    fill="none" 
                                    stroke="white" 
                                    stroke-width="10"/>
                        </svg>
                    `)

                    // Adicionar borda e foto aos composites
                    composites.push({
                        input: await sharp(whiteBorder).png().toBuffer(),
                        left: photoX - 10,
                        top: photoY - 10
                    })
                    composites.push({
                        input: circularPhoto,
                        left: photoX,
                        top: photoY
                    })

                    console.log('✅ Foto circular com borda adicionada')
                }
            } catch (photoError) {
                console.warn('⚠️ Erro ao processar foto:', photoError)
            }
        }

        // Preparar textos
        const displayName = data.name && data.name.trim() ? data.name : 'Nome não informado'
        const formattedDate = data.certificationDate
            ? new Date(data.certificationDate).toLocaleDateString('pt-BR')
            : 'Data não informada'
        const formattedCPF = data.cpf && data.cpf.trim() ? formatCPF(data.cpf) : 'CPF não informado'

        // Calcular posições com espaçamento personalizado
        const nameToDateSpacing = 1
        const dateToCpfSpacing = 20
        const centerY = height / 2
        const textBlockLeft = 50
        const maxNameWidth = Math.floor(width * 0.30)

        // Quebrar nome em linhas se necessário
        const nameLines = breakTextIntoLines(displayName, maxNameWidth, 40)
        const nameFontSize = 40
        const dateFontSize = 15
        const cpfFontSize = 25
        const lineHeight = nameFontSize + 10 // Altura da linha = tamanho da fonte + espaço

        // Calcular posições Y (arredondar para inteiros)
        const nameBlockHeight = nameLines.length * lineHeight
        const nameY = Math.round(centerY - (nameBlockHeight / 2) - 30)
        const dateY = Math.round(nameY + nameBlockHeight + nameToDateSpacing)
        const cpfY = Math.round(dateY + dateFontSize + dateToCpfSpacing)

        // Adicionar textos do nome (múltiplas linhas se necessário)
        for (let i = 0; i < nameLines.length; i++) {
            const lineY = Math.round(nameY + (i * lineHeight))
            const nameSvg = createTextSVG(nameLines[i], nameFontSize, 'bold', 'black', {
                width: maxNameWidth,
                align: 'right'
            })
            composites.push({
                input: await sharp(Buffer.from(nameSvg)).png().toBuffer(),
                left: textBlockLeft,
                top: lineY
            })
        }

        // Adicionar texto da data
        const dateSvg = createTextSVG(`Habilitado(a) desde ${formattedDate}`, dateFontSize, 'normal', 'black', {
            width: maxNameWidth,
            align: 'right'
        })
        composites.push({
            input: await sharp(Buffer.from(dateSvg)).png().toBuffer(),
            left: textBlockLeft,
            top: dateY
        })

        // Adicionar texto do CPF
        const cpfSvg = createTextSVG(formattedCPF, cpfFontSize, 'normal', 'black', {
            width: maxNameWidth,
            align: 'right'
        })
        composites.push({
            input: await sharp(Buffer.from(cpfSvg)).png().toBuffer(),
            left: textBlockLeft,
            top: cpfY
        })

        const edgeMargin = 50

        // Adicionar QR Code
        try {
            const qrSize = 150
            const qrBuffer = await QRCode.toBuffer(data.qrToken, {
                width: qrSize,
                margin: 1,
                errorCorrectionLevel: 'M',
                type: 'png'
            })

            composites.push({
                input: qrBuffer,
                left: width - edgeMargin - qrSize,
                top: height - edgeMargin - qrSize
            })
        } catch (qrError) {
            console.warn('⚠️ Erro ao gerar QR Code:', qrError)
        }

        // Adicionar logo MAF
        try {
            const logoPath = path.join(process.cwd(), 'public', 'logomaf.png')
            if (fs.existsSync(logoPath)) {
                const logoWidth = 150
                const logoHeight = 89
                const logoBuffer = await sharp(logoPath)
                    .resize(logoWidth, logoHeight)
                    .png()
                    .toBuffer()

                composites.push({
                    input: logoBuffer,
                    left: width - edgeMargin - logoWidth,
                    top: edgeMargin
                })
            }
        } catch (logoError) {
            console.warn('⚠️ Erro ao adicionar logo:', logoError)
        }

        // Adicionar textos do rodapé
        const footerLabel = createTextSVG('Registro:', 20, 'bold', 'black')
        const footerLabelTop = height - 95
        composites.push({
            input: await sharp(Buffer.from(footerLabel)).png().toBuffer(),
            left: edgeMargin,
            top: footerLabelTop
        })

        const footerValue = createTextSVG(data.cardNumber || 'MAF-TEST-001', 25, 'normal', 'black')
        composites.push({
            input: await sharp(Buffer.from(footerValue)).png().toBuffer(),
            left: edgeMargin,
            top: footerLabelTop + 25
        })

        // Compor todas as camadas e retornar
        return await base.composite(composites).png().toBuffer()

    } catch (error) {
        console.error('❌ Erro ao gerar cartão:', error)
        throw error
    }
}

export async function generateCardPDF(data: {
    name: string
    cpf: string
    cardNumber: string
    qrToken: string
    photoPath?: string | null
    certificationDate?: string | null
}) {
    try {
        const pdfDoc = await PDFDocument.create()
        // Tamanho de cartão de crédito: 85.6mm x 53.98mm = ~243 x 153 pontos
        const page = pdfDoc.addPage([243, 153])
        const { width, height } = page.getSize()

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

        // Import getServiceSupabase to download photo
        const { getServiceSupabase } = await import('@/lib/supabase')

        // DESIGN: Cartão dividido em duas seções
        // Esquerda (~60%): Fundo branco com informações em preto
        // Direita (~40%): Gradiente azul-turquesa com foto circular grande sobrepondo

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
            try {
                const supabase = getServiceSupabase()
                const { data: photoData, error: photoError } = await supabase.storage
                    .from('photos')
                    .download(data.photoPath)

                if (!photoError && photoData) {
                    const photoBuffer = await photoData.arrayBuffer()
                    const originalBuffer = Buffer.from(photoBuffer)
                    
                    // Foto pequena, centralizada
                    const photoSize = 50
                    
                    // Criar máscara circular (fundo transparente, círculo opaco)
                    const maskBuffer = await sharp({
                        create: {
                            width: photoSize,
                            height: photoSize,
                            channels: 4,
                            background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo transparente
                        }
                    })
                    .composite([{
                        input: Buffer.from(`<svg width="${photoSize}" height="${photoSize}"><circle cx="${photoSize/2}" cy="${photoSize/2}" r="${photoSize/2}" fill="white"/></svg>`),
                        blend: 'over'
                    }])
                    .png()
                    .toBuffer()
                    
                    // Processar imagem com máscara circular
                    const circularBuffer = await sharp(originalBuffer)
                        .resize(photoSize, photoSize, {
                            fit: 'cover',
                            position: 'center',
                            withoutEnlargement: false,
                            kernel: 'nearest'
                        })
                        .composite([{
                            input: maskBuffer,
                            blend: 'dest-in'
                        }])
                        .png()
                        .toBuffer()
                    
                    const photoImage = await pdfDoc.embedPng(circularBuffer)

                    const photoX = width / 2 - photoSize / 2
                    const photoY = height / 2 - photoSize / 2

                    // Desenhar foto circular (já processada)
                    page.drawImage(photoImage, {
                        x: photoX,
                        y: photoY,
                        width: photoSize,
                        height: photoSize,
                    })
                }
            } catch (photoErr) {
                console.error('Erro ao carregar foto:', photoErr)
            }
        }

        // Nome completo à esquerda (em preto sobre fundo branco)
        const nameSize = 50
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
                size: 30,
                font: fontRegular,
                color: rgb(0.6, 0.6, 0.6),
            })
        }

        // CPF abaixo da data (em preto)
        page.drawText(data.cpf, {
            x: 25,
            y: height / 2 - 6,
            size: 30,
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
