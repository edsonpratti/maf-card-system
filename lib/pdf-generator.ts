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
        // Verificar se estamos no Vercel (ambiente de produção)
        const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined

        console.log('ℹ️ Ambiente Vercel detectado - usando abordagem sem Canvas' + (isVercel ? ' (Vercel)' : ' (Local)'))

        // Abordagem sem Canvas: usar apenas Sharp para composição
        const fs = await import('fs')
        const path = await import('path')

        // Carregar imagens base
        const backgroundPath = path.join(process.cwd(), 'public', 'padrao_fundo_carteira.png')
        let cardImage = sharp(backgroundPath)

        // Preparar textos como imagens
        const displayName = data.name && data.name.trim() ? data.name : 'Nome não informado'
        const formattedDate = data.certificationDate
            ? new Date(data.certificationDate).toLocaleDateString('pt-BR')
            : 'Data não informada'
        const formattedCPF = data.cpf && data.cpf.trim() ? formatCPF(data.cpf) : 'CPF não informado'

        // Calcular posições
        const nameToDateSpacing = 30
        const dateToCpfSpacing = 45
        const centerY = 591 / 2
        const nameY = centerY - (nameToDateSpacing / 2) - dateToCpfSpacing
        const dateY = nameY + nameToDateSpacing
        const cpfY = dateY + dateToCpfSpacing

        // Criar composições de texto
        const textCompositions = []

        // Nome
        const nameSvg = `
            <svg width="800" height="50">
                <text x="0" y="35" font-family="Helvetica" font-size="40" font-weight="bold" fill="black" dominant-baseline="alphabetic">${displayName}</text>
            </svg>`
        const nameBuffer = await sharp(Buffer.from(nameSvg)).png().toBuffer()
        textCompositions.push({ input: nameBuffer, left: 50, top: Math.round(nameY) })

        // Data
        const dateSvg = `
            <svg width="800" height="25">
                <text x="0" y="15" font-family="Helvetica" font-size="15" fill="black" dominant-baseline="alphabetic">Habilitado(a) desde ${formattedDate}</text>
            </svg>`
        const dateBuffer = await sharp(Buffer.from(dateSvg)).png().toBuffer()
        textCompositions.push({ input: dateBuffer, left: 50, top: Math.round(dateY) })

        // CPF
        const cpfSvg = `
            <svg width="800" height="35">
                <text x="0" y="25" font-family="Helvetica" font-size="25" fill="black" dominant-baseline="alphabetic">${formattedCPF}</text>
            </svg>`
        const cpfBuffer = await sharp(Buffer.from(cpfSvg)).png().toBuffer()
        textCompositions.push({ input: cpfBuffer, left: 50, top: Math.round(cpfY) })

        // Registro
        const registroSvg = `
            <svg width="200" height="25">
                <text x="0" y="20" font-family="Helvetica" font-size="20" font-weight="bold" fill="black" dominant-baseline="alphabetic">Registro:</text>
            </svg>`
        const registroBuffer = await sharp(Buffer.from(registroSvg)).png().toBuffer()
        textCompositions.push({ input: registroBuffer, left: 50, top: 591 - 75 })

        // Código
        const codeSvg = `
            <svg width="300" height="30">
                <text x="0" y="25" font-family="Helvetica" font-size="25" fill="black" dominant-baseline="alphabetic">${data.cardNumber || 'MAF-TEST-001'}</text>
            </svg>`
        const codeBuffer = await sharp(Buffer.from(codeSvg)).png().toBuffer()
        textCompositions.push({ input: codeBuffer, left: 50, top: 591 - 50 })

        // Aplicar composições de texto
        cardImage = cardImage.composite(textCompositions)

        // Adicionar foto se existir
        if (data.photoPath) {
            try {
                // Baixar foto do Supabase
                const { getServiceSupabase } = await import('@/lib/supabase')
                const supabase = getServiceSupabase()

                const { data: photoData, error } = await supabase.storage
                    .from('user-photos')
                    .download(data.photoPath)

                if (photoData && !error) {
                    const photoBuffer = Buffer.from(await photoData.arrayBuffer())

                    // Processar foto (cortar para quadrado e redimensionar)
                    const processedPhoto = await sharp(photoBuffer)
                        .resize(200, 200, { fit: 'cover', position: 'center' })
                        .png()
                        .toBuffer()

                    // Posicionar foto (lado direito, centralizada verticalmente)
                    cardImage = cardImage.composite([{
                        input: processedPhoto,
                        left: 1063 - 250,
                        top: Math.round((591 - 200) / 2)
                    }])
                }
            } catch (photoError) {
                console.warn('⚠️ Erro ao processar foto:', photoError)
            }
        }

        // Gerar QR Code
        try {
            const qrCodeDataURL = await QRCode.toDataURL(data.qrToken, {
                width: 150,
                margin: 1,
                color: { dark: '#000000', light: '#FFFFFF' }
            })

            // Converter data URL para buffer
            const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64')

            // Posicionar QR Code (canto inferior direito)
            cardImage = cardImage.composite([{
                input: qrBuffer,
                left: 1063 - 200,
                top: 591 - 200
            }])
        } catch (qrError) {
            console.warn('⚠️ Erro ao gerar QR Code:', qrError)
        }

        // Adicionar logo MAF
        try {
            const logoPath = path.join(process.cwd(), 'public', 'logo-maf.png')
            if (fs.existsSync(logoPath)) {
                const logoBuffer = await sharp(logoPath)
                    .resize(100, 100, { fit: 'inside' })
                    .png()
                    .toBuffer()

                // Posicionar logo (canto superior direito)
                cardImage = cardImage.composite([{
                    input: logoBuffer,
                    left: 1063 - 120,
                    top: 20
                }])
            }
        } catch (logoError) {
            console.warn('⚠️ Erro ao adicionar logo:', logoError)
        }

        // Converter para PNG
        const finalBuffer = await cardImage.png().toBuffer()

        console.log(`✅ Cartão gerado com sucesso! Tamanho: ${finalBuffer.length} bytes`)
        return finalBuffer

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
