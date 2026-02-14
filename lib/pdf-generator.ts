import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"
import sharp from "sharp"
import { createCanvas } from "canvas"

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
        // Registrar fontes Montserrat
        const { registerFont, loadImage } = await import('canvas')
        const fs = await import('fs')
        const path = await import('path')

        const montserratRegularPath = path.join(process.cwd(), 'public', 'fonts', 'montserrat-regular.woff2')
        const montserratBoldPath = path.join(process.cwd(), 'public', 'fonts', 'montserrat-bold.woff2')

        // Verificar se estamos no Vercel (ambiente de produção)
        const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined

        let fontRegistered = false

        // Só tentar registrar fontes customizadas se NÃO estiver no Vercel
        if (!isVercel) {
            try {
                if (fs.existsSync(montserratRegularPath)) {
                    registerFont(montserratRegularPath, { family: 'Montserrat', weight: 'normal' })
                    console.log('✅ Fonte Montserrat Regular registrada')
                }
                if (fs.existsSync(montserratBoldPath)) {
                    registerFont(montserratBoldPath, { family: 'Montserrat', weight: 'bold' })
                    console.log('✅ Fonte Montserrat Bold registrada')
                }
                fontRegistered = true
            } catch (fontError) {
                console.warn('⚠️ Erro ao registrar fontes Montserrat, usando Arial como fallback:', fontError instanceof Error ? fontError.message : String(fontError))
            }
        } else {
            console.log('ℹ️ Ambiente Vercel detectado - usando fontes padrão do sistema')
        }

        // Configurar ambiente para Canvas funcionar no Vercel
        if (isVercel) {
            // Desabilitar Fontconfig no Vercel
            process.env.FONTCONFIG_PATH = '/dev/null'
            process.env.FONTCONFIG_FILE = '/dev/null'
        }

        // Dimensões do cartão: 1063 × 591 pixels
        const width = 1063
        const height = 591

        // Criar canvas para desenhar tudo
        const { createCanvas } = await import('canvas')
        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext('2d')

        const backgroundPath = path.join(process.cwd(), 'public', 'padrao_fundo_carteira.png')
        const backgroundImage = await loadImage(backgroundPath)

        // Desenhar imagem de fundo
        ctx.drawImage(backgroundImage, 0, 0, width, height)

        // Textos com tamanhos específicos e centralizados verticalmente
        ctx.fillStyle = 'black'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'

        // Calcular posições com espaçamento personalizado
        const nameToDateSpacing = 30  // Espaçamento nome → data
        const dateToCpfSpacing = 45   // Espaçamento data → CPF
        const centerY = height / 2

        // Centralizar o bloco de texto considerando espaçamentos diferentes
        const nameY = centerY - (nameToDateSpacing / 2) - dateToCpfSpacing
        const dateY = nameY + nameToDateSpacing
        const cpfY = dateY + dateToCpfSpacing

        // Nome: (negrito, 40px)
        ctx.font = 'bold 40px Helvetica'
        const displayName = data.name && data.name.trim() ? data.name : 'Nome não informado'
        ctx.fillText(displayName, 50, Math.round(nameY))

        // Data: (normal, 15px) - usar data real do usuário
        ctx.font = '15px Helvetica'
        const formattedDate = data.certificationDate
            ? new Date(data.certificationDate).toLocaleDateString('pt-BR')
            : 'Data não informada'
        ctx.fillText(`Habilitado(a) desde ${formattedDate}`, 50, Math.round(dateY))

        // CPF: (normal, 25px) - usar CPF real do usuário formatado
        ctx.font = '25px Helvetica'
        const formattedCPF = data.cpf && data.cpf.trim() ? formatCPF(data.cpf) : 'CPF não informado'
        ctx.fillText(formattedCPF, 50, Math.round(cpfY))

        // Adicionar foto se existir (lado direito)
        if (data.photoPath) {
            try {
                // Importar Supabase dinamicamente apenas se necessário
                const { getServiceSupabase } = await import('@/lib/supabase')
                const supabase = getServiceSupabase()
                const { data: photoData, error: photoError } = await supabase.storage
                    .from('photos')
                    .download(data.photoPath)

                if (!photoError && photoData) {
                    const photoBuffer = await photoData.arrayBuffer()
                    const originalBuffer = Buffer.from(photoBuffer)

                    // Carregar imagem da foto
                    const photoImg = await loadImage(originalBuffer)

                    const photoSize = 250
                    // Centralizar foto no cartão
                    const photoX = (width - photoSize) / 2
                    const photoY = (height - photoSize) / 2

                    // Implementar modo COVER: redimensionar para cobrir toda a área circular
                    const imgWidth = photoImg.width
                    const imgHeight = photoImg.height
                    const aspectRatio = imgWidth / imgHeight
                    const circleAspectRatio = 1 // Círculo é sempre 1:1

                    let scale, sourceX, sourceY, sourceWidth, sourceHeight

                    if (aspectRatio > circleAspectRatio) {
                        // Imagem mais larga: cortar nas laterais
                        scale = photoSize / imgHeight
                        sourceHeight = imgHeight
                        sourceWidth = photoSize / scale
                        sourceX = (imgWidth - sourceWidth) / 2
                        sourceY = 0
                    } else {
                        // Imagem mais alta ou quadrada: cortar em cima/baixo
                        scale = photoSize / imgWidth
                        sourceWidth = imgWidth
                        sourceHeight = photoSize / scale
                        sourceX = 0
                        sourceY = (imgHeight - sourceHeight) / 2
                    }

                    // Desenhar borda circular branca de 5px
                    ctx.save()
                    ctx.strokeStyle = 'white'
                    ctx.lineWidth = 10 // 5px de cada lado = 10px total
                    ctx.beginPath()
                    ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2 + 5, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.restore()

                    // Criar círculo para máscara
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, Math.PI * 2)
                    ctx.clip()

                    // Desenhar foto em modo COVER (cortando partes que não couberem)
                    ctx.imageSmoothingEnabled = true
                    ctx.drawImage(
                        photoImg,
                        sourceX, sourceY, sourceWidth, sourceHeight, // Parte da imagem original
                        photoX, photoY, photoSize, photoSize // Destino no canvas
                    )
                    ctx.restore()
                }
            } catch (photoErr) {
                console.error('Erro ao carregar foto:', photoErr)
                // Continua sem a foto em caso de erro
            }
        }

        // Adicionar QR Code (canto inferior direito)
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maf-card-system.vercel.app'
            const qrBuffer = await QRCode.toBuffer(`${baseUrl}/validar/${data.qrToken}`, {
                width: 180,
                margin: 1,
                errorCorrectionLevel: 'M',
                type: 'png'
            })

            // Carregar QR code como imagem
            const qrImg = await loadImage(qrBuffer)

            const qrX = width - 230  // 180 (tamanho) + 50 (margem) = 230
            const qrY = height - 230 // 180 (tamanho) + 50 (margem) = 230
            ctx.drawImage(qrImg, qrX, qrY, 180, 180)

        } catch (qrError) {
            console.error('Erro ao gerar QR Code:', qrError)
        }

        // Adicionar logo MAF no canto superior direito
        try {
            const logoPath = path.join(process.cwd(), 'public', 'logomaf.png')
            const logoImg = await loadImage(logoPath)

            // Definir tamanho da logo (2x maior)
            const logoSize = 160
            const logoX = width - logoSize - 40 // 40px de margem da borda direita (afastada)
            const logoY = 20 // 20px do topo

            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)

        } catch (logoError) {
            console.error('Erro ao carregar logo MAF:', logoError)
        }

        // Adicionar código do usuário no canto inferior esquerdo
        ctx.fillStyle = 'black'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'

        // "Registro:" em negrito 20px - 50px das bordas esquerda e inferior
        ctx.font = 'bold 20px Helvetica'
        ctx.fillText('Registro:', 50, height - 75)

        // Código do usuário em normal 25px - 50px das bordas esquerda e inferior
        ctx.font = '25px Helvetica'
        ctx.fillText(data.cardNumber || 'MAF-TEST-001', 50, height - 50)

        // Retornar buffer do canvas
        return canvas.toBuffer('image/png')
    } catch (error) {
        console.error('Erro em generateCardPNG:', error)
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
