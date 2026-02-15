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

        console.log('ℹ️ Ambiente detectado - usando abordagem híbrida' + (isVercel ? ' (Vercel)' : ' (Local)'))

        // Abordagem híbrida: Canvas para elementos gráficos, Sharp para composição
        const { createCanvas, loadImage } = await import('canvas')
        const fs = await import('fs')
        const path = await import('path')

        // Dimensões do cartão: 1063 × 591 pixels
        const width = 1063
        const height = 591

        // Criar canvas para elementos gráficos (fundo, foto, QR)
        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext('2d')

        // Configurar máxima qualidade para renderização
        ctx.imageSmoothingEnabled = true
        // ctx.imageSmoothingQuality = 'high' // Not available in all Canvas implementations

        // Carregar imagem de fundo
        const backgroundPath = path.join(process.cwd(), 'public', 'padrao_fundo_carteira.png')
        const backgroundImage = await loadImage(backgroundPath)

        // Desenhar imagem de fundo
        ctx.drawImage(backgroundImage, 0, 0, width, height)

        // Adicionar foto se existir (ANTES dos textos para não ser coberta)
        if (data.photoPath) {
            try {
                let photoBuffer: Buffer | null = null

                // Verificar se é um caminho local (para testes) ou do Supabase
                let triedLocal = false

                // Primeiro tentar como local (para testes)
                if (data.photoPath && !data.photoPath.startsWith('http')) {
                    const localPhotoPath = path.join(process.cwd(), 'public', data.photoPath)
                    if (fs.existsSync(localPhotoPath)) {
                        photoBuffer = fs.readFileSync(localPhotoPath)
                        console.log('📸 Usando foto local para teste:', localPhotoPath)
                        triedLocal = true
                    }
                }

                // Se não conseguiu carregar como local, tentar do Supabase
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
                    } else {
                        console.warn('⚠️ Foto não encontrada no Supabase:', error?.message || 'Erro desconhecido')
                    }
                }

                // Only process photo if buffer was loaded successfully
                if (photoBuffer) {
                    // Carregar imagem da foto
                    const photoImg = await loadImage(photoBuffer)

                    const photoSize = 260
                    // Centralizar foto horizontal e verticalmente no cartão
                    const photoX = (width - photoSize) / 2  // Centralizado horizontalmente
                    const photoY = (height - photoSize) / 2  // Centralizado verticalmente

                    // Desenhar borda branca de 5px ao redor da foto
                    ctx.save()
                    ctx.strokeStyle = 'white'
                    ctx.lineWidth = 10  // 5px de cada lado = 10px total
                    ctx.beginPath()
                    ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2 + 5, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.restore()

                    // Implementar modo COVER: cortar imagem para preencher o círculo mantendo proporção
                    const imgWidth = photoImg.width
                    const imgHeight = photoImg.height
                    const imgAspectRatio = imgWidth / imgHeight
                    const circleAspectRatio = 1 // Círculo é sempre 1:1

                    let sourceX, sourceY, sourceWidth, sourceHeight

                    if (imgAspectRatio > circleAspectRatio) {
                        // Imagem mais larga: cortar nas laterais
                        sourceHeight = imgHeight
                        sourceWidth = imgHeight // Quadrado baseado na altura
                        sourceX = (imgWidth - sourceWidth) / 2
                        sourceY = 0
                    } else {
                        // Imagem mais alta ou quadrada: cortar em cima/baixo
                        sourceWidth = imgWidth
                        sourceHeight = imgWidth // Quadrado baseado na largura
                        sourceX = 0
                        sourceY = (imgHeight - sourceHeight) / 2
                    }

                    // Criar máscara circular para a foto
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, Math.PI * 2)
                    ctx.clip()

                    // Desenhar foto em modo COVER (cortando partes que não couberem)
                    ctx.drawImage(
                        photoImg,
                        sourceX, sourceY, sourceWidth, sourceHeight, // Parte da imagem original
                        photoX, photoY, photoSize, photoSize // Destino no canvas
                    )
                    ctx.restore()

                    console.log('✅ Foto circular (modo cover) com borda branca adicionada ao cartão')
                } // Close if (photoBuffer)

            } catch (photoError) {
                console.warn('⚠️ Erro ao processar foto:', photoError)
            }
        }

        // Função para renderizar texto usando Sharp (evita problemas de Fontconfig)
        async function drawTextOnCanvas(text: string, x: number, y: number, options: {
            fontSize: number;
            fontWeight?: string;
            color?: string;
        }) {
            const fontWeight = options.fontWeight === 'bold' ? 'font-weight="bold"' : ''
            const color = options.color || 'black'

            // Criar SVG com o texto usando fonte básica
            const svgText = `
                <svg width="${text.length * options.fontSize * 0.6}" height="${options.fontSize + 10}" xmlns="http://www.w3.org/2000/svg">
                    <text x="0" y="${options.fontSize}"
                          font-family="Arial, sans-serif"
                          font-size="${options.fontSize}"
                          ${fontWeight}
                          fill="${color}">${text}</text>
                </svg>
            `

            try {
                // Converter SVG para PNG usando Sharp
                const textBuffer = await sharp(Buffer.from(svgText))
                    .png()
                    .toBuffer()

                // Carregar como imagem e desenhar no Canvas
                const textImage = await loadImage(textBuffer)
                ctx.drawImage(textImage, x, y - options.fontSize)
            } catch (error) {
                console.error('❌ Erro crítico ao renderizar texto:', text, error)
                throw new Error(`Falha ao renderizar texto: ${text}`)
            }
        }

        // Adicionar textos usando Sharp (evita problemas de Fontconfig)
        const displayName = data.name && data.name.trim() ? data.name : 'Nome não informado'
        const formattedDate = data.certificationDate
            ? new Date(data.certificationDate).toLocaleDateString('pt-BR')
            : 'Data não informada'
        const formattedCPF = data.cpf && data.cpf.trim() ? formatCPF(data.cpf) : 'CPF não informado'

        // Função para quebrar texto em linhas baseado na largura máxima
        function breakTextIntoLines(text: string, maxWidth: number, fontSize: number): string[] {
            const words = text.split(' ')
            const lines: string[] = []
            let currentLine = ''

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word
                // Estimativa aproximada da largura (caractere médio * tamanho da fonte)
                const estimatedWidth = testLine.length * fontSize * 0.6

                if (estimatedWidth <= maxWidth && currentLine) {
                    currentLine = testLine
                } else if (estimatedWidth <= maxWidth) {
                    currentLine = word
                } else {
                    // Palavra muito longa, forçar quebra
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

        // Calcular posições com espaçamento personalizado
        const nameToDateSpacing = -5  // Espaçamento nome → data: -5px (sobreposição)
        const dateToCpfSpacing = 45   // Espaçamento data → CPF
        const centerY = height / 2

        // Largura máxima para o nome: 35% do cartão
        const maxNameWidth = Math.floor(width * 0.35) // 35% da largura = ~372px

        // Quebrar nome em linhas se necessário
        const nameLines = breakTextIntoLines(displayName, maxNameWidth, 40)
        const lineHeight = 45 // Altura de linha para texto em negrito

        // Calcular posição Y inicial do nome (ajustar se múltiplas linhas)
        const nameBlockHeight = nameLines.length * lineHeight
        const nameY = centerY - (nameToDateSpacing / 2) - dateToCpfSpacing - (nameBlockHeight - lineHeight) / 2
        const dateY = nameY + nameBlockHeight + nameToDateSpacing
        const cpfY = dateY + dateToCpfSpacing

        // Renderizar nome (possivelmente múltiplas linhas)
        for (let i = 0; i < nameLines.length; i++) {
            const lineY = nameY + (i * lineHeight)
            await drawTextOnCanvas(nameLines[i], 50, lineY, { fontSize: 40, fontWeight: 'bold', color: 'black' })
        }

        // Renderizar textos restantes
        await drawTextOnCanvas(`Habilitado(a) desde ${formattedDate}`, 50, dateY, { fontSize: 15, color: 'black' })
        await drawTextOnCanvas(formattedCPF, 50, cpfY, { fontSize: 25, color: 'black' })

        // Adicionar QR Code
        try {
            const qrBuffer = await QRCode.toBuffer(data.qrToken, {
                width: 150,
                margin: 1,
                errorCorrectionLevel: 'M',
                type: 'png'
            })

            // Carregar QR code como imagem
            const qrImg = await loadImage(qrBuffer)

            const qrX = width - 200
            const qrY = height - 180  // Ajustado para não sobrepor a foto
            ctx.drawImage(qrImg, qrX, qrY, 150, 150)
        } catch (qrError) {
            console.warn('⚠️ Erro ao gerar QR Code:', qrError)
        }

        // Adicionar logo MAF
        try {
            const logoPath = path.join(process.cwd(), 'public', 'logomaf.png')
            if (fs.existsSync(logoPath)) {
                const logoImg = await loadImage(logoPath)

                // Definir tamanho da logo mantendo proporção (1980x1169 ≈ 1.69:1)
                const logoWidth = 150
                const logoHeight = Math.round(logoWidth / 1.69) // ≈ 89px
                const logoX = width - logoWidth - 50  // 50px da borda direita
                const logoY = 50  // 50px do topo

                ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight)
            } else {
                console.warn('⚠️ Arquivo de logo não encontrado:', logoPath)
            }
        } catch (logoError) {
            console.warn('⚠️ Erro ao adicionar logo:', logoError)
        }

        // Adicionar textos do rodapé
        await drawTextOnCanvas('Registro:', 50, height - 75, { fontSize: 20, fontWeight: 'bold', color: 'black' })
        await drawTextOnCanvas(data.cardNumber || 'MAF-TEST-001', 50, height - 50, { fontSize: 25, color: 'black' })

        // Retornar buffer do canvas
        return canvas.toBuffer('image/png')

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
