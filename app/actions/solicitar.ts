"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { cleanCPF, generateCardNumber } from "@/lib/utils"
import { z } from "zod"
import { studentSchema } from "@/lib/validators"
import { sendWelcomeEmail } from "./first-access"
import crypto from "crypto"

// Rate limiting helper (simple in-memory implementation)
// AVISO DE SEGURANÇA: Esta implementação em memória não persiste entre reinicializações
// do servidor e não é compartilhada entre múltiplas instâncias (ex: Vercel Serverless).
// Para proteção real em produção, substitua por uma solução baseada em banco de dados
// (ex: tabela de rate_limits no Supabase) ou Redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const record = rateLimitMap.get(identifier)

    if (!record || now > record.resetAt) {
        rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
        return true
    }

    if (record.count >= maxAttempts) {
        return false
    }

    record.count++
    return true
}

export async function checkCPFExists(cpf: string) {
    // Basic input validation
    const clean = cleanCPF(cpf)
    if (!clean || clean.length !== 11) {
        return {
            exists: false,
            alreadyApplied: false,
            message: "CPF inválido."
        }
    }

    // Rate limiting by CPF
    if (!checkRateLimit(`cpf-check-${clean}`, 5, 60000)) {
        return {
            exists: false,
            alreadyApplied: false,
            message: "Muitas tentativas. Aguarde um minuto."
        }
    }


    const supabase = getServiceSupabase()

    // Check if already applied
    const { data: existingUser } = await supabase
        .from("users_cards")
        .select("id, status")
        .eq("cpf", clean)
        .single()

    if (existingUser) {
        return {
            exists: true,
            alreadyApplied: true,
            status: existingUser.status,
            message: "CPF já cadastrado. Acesse o portal para ver status."
        }
    }

    // Check base
    const { data: student } = await supabase
        .from("students_base")
        .select("name")
        .eq("cpf", clean)
        .single()

    if (student) {
        return {
            exists: true,
            alreadyApplied: false,
            name: student.name,
            message: "CPF encontrado na base de alunas! Cadastro será aprovado automaticamente."
        }
    }

    return {
        exists: false,
        alreadyApplied: false,
        message: "CPF não encontrado. Você precisará enviar seu certificado para análise."
    }
}

export async function checkEmailExists(purchaseEmail: string) {
    const email = purchaseEmail.trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            exists: false,
            alreadyApplied: false,
            message: "Email inválido."
        }
    }

    // Rate limiting by email
    if (!checkRateLimit(`email-check-${email}`, 5, 60000)) {
        return {
            exists: false,
            alreadyApplied: false,
            message: "Muitas tentativas. Aguarde um minuto."
        }
    }

    const supabase = getServiceSupabase()

    // Check if already applied (by email, for foreign students)
    const { data: existingUser } = await supabase
        .from("users_cards")
        .select("id, status")
        .eq("email", email)
        .eq("is_foreign", true)
        .single()

    if (existingUser) {
        return {
            exists: true,
            alreadyApplied: true,
            status: existingUser.status,
            message: "Email já cadastrado. Acesse o portal para ver status."
        }
    }

    // Check students_base by email (foreign students)
    const { data: student } = await supabase
        .from("students_base")
        .select("name")
        .eq("email", email)
        .eq("is_foreign", true)
        .single()

    if (student) {
        return {
            exists: true,
            alreadyApplied: false,
            name: student.name,
            message: "Email encontrado na base de alunas! Cadastro será aprovado automaticamente."
        }
    }

    return {
        exists: false,
        alreadyApplied: false,
        message: "Email não encontrado. Você precisará enviar seu certificado para análise."
    }
}

export async function checkContactEmailExists(contactEmail: string) {
    const email = contactEmail.trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { alreadyRegistered: false, message: "Email inválido." }
    }

    // Rate limiting
    if (!checkRateLimit(`contact-email-check-${email}`, 5, 60000)) {
        return { alreadyRegistered: false, message: "Muitas tentativas. Aguarde um minuto." }
    }

    const supabase = getServiceSupabase()

    // Check if email is already registered in users_cards (auth account created)
    const { data: existingUser } = await supabase
        .from("users_cards")
        .select("id, auth_user_id")
        .eq("email", email)
        .single()

    if (existingUser) {
        return {
            alreadyRegistered: true,
            message: "Este email já possui uma conta cadastrada.",
        }
    }

    return { alreadyRegistered: false, message: "" }
}

export async function submitApplication(prevState: any, formData: FormData) {
    try {
    const supabase = getServiceSupabase()

    const isForeign = formData.get("isForeign") === "true"

    if (!isForeign) {
        // ── Fluxo brasileiro: validação por CPF ──────────────────────────────
        const cpfToCheck = cleanCPF(formData.get("cpf") as string)
        if (cpfToCheck && cpfToCheck.length === 11) {
            const { data: existingUser } = await supabase
                .from("users_cards")
                .select("id")
                .eq("cpf", cpfToCheck)
                .single()
            if (existingUser) {
                return { success: false, message: "CPF já cadastrado. Acesse o portal para ver o status do seu pedido." }
            }
        }
    } else {
        // ── Fluxo estrangeiro: validação por email de compra ─────────────────
        const purchaseEmailRaw = (formData.get("purchaseEmail") as string)?.trim().toLowerCase()
        if (purchaseEmailRaw) {
            const { data: existingUser } = await supabase
                .from("users_cards")
                .select("id")
                .eq("email", purchaseEmailRaw)
                .eq("is_foreign", true)
                .single()
            if (existingUser) {
                return { success: false, message: "Email já cadastrado. Acesse o portal para ver o status do seu pedido." }
            }
        }
    }

    const rawData = {
        name: formData.get("name"),
        cpf: isForeign ? null : formData.get("cpf"),
        purchaseEmail: isForeign ? (formData.get("purchaseEmail") as string)?.trim().toLowerCase() : null,
        whatsapp: formData.get("whatsapp"),
        email: formData.get("email"),
        certificationDate: formData.get("certificationDate"),
        address: {
            cep: formData.get("address.cep"),
            street: formData.get("address.street"),
            number: formData.get("address.number"),
            complement: formData.get("address.complement"),
            neighborhood: formData.get("address.neighborhood"),
            city: formData.get("address.city"),
            state: formData.get("address.state"),
        },
        // We will handle the files separately
    }

    const cpfClean = isForeign ? null : cleanCPF(rawData.cpf as string)

    if (!isForeign) {
        // Basic CPF validation
        if (!cpfClean || cpfClean.length !== 11) {
            return { success: false, message: "CPF inválido." }
        }

        // Rate limiting by CPF to prevent spam
        if (!checkRateLimit(`submit-${cpfClean}`, 3, 3600000)) { // 3 attempts per hour
            return { success: false, message: "Muitas tentativas. Aguarde antes de tentar novamente." }
        }
    } else {
        // Rate limiting by purchase email for foreigners
        const rateLimitKey = `submit-foreign-${rawData.purchaseEmail}`
        if (!checkRateLimit(rateLimitKey, 3, 3600000)) {
            return { success: false, message: "Muitas tentativas. Aguarde antes de tentar novamente." }
        }
    }

    // Additional validation for required fields
    if (!rawData.name || !rawData.email || !rawData.whatsapp) {
        return { success: false, message: "Todos os campos obrigatórios devem ser preenchidos." }
    }

    // Check base again to determine status
    let student = null
    if (!isForeign && cpfClean) {
        const { data } = await supabase
            .from("students_base")
            .select("id")
            .eq("cpf", cpfClean)
            .single()
        student = data
    } else if (isForeign && rawData.purchaseEmail) {
        const { data } = await supabase
            .from("students_base")
            .select("id")
            .eq("email", rawData.purchaseEmail)
            .eq("is_foreign", true)
            .single()
        student = data
    }

    let status = "PENDENTE_MANUAL"
    let cardNumber = null
    let validationToken = null

    if (student) {
        status = "AUTO_APROVADA"

        // Gerar card_number e validation_token para aprovação automática
        cardNumber = generateCardNumber()

        // Gerar token seguro sem usar require()
        validationToken = Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('')
    }

    // Handle Photo Upload (required)
    const photoFile = formData.get("photo") as File | null
    let photoPath = null

    if (!photoFile || photoFile.size === 0) {
        return { success: false, message: "A foto é obrigatória." }
    }

    // Validation: check file size (< 2MB)
    if (photoFile.size > 2 * 1024 * 1024) {
        return { success: false, message: "A foto deve ter no máximo 2MB." }
    }

    // Validate file type
    if (!photoFile.type.match(/^image\/(jpeg|jpg|png)$/)) {
        return { success: false, message: "Apenas arquivos JPG ou PNG são permitidos para a foto." }
    }

    const photoExt = photoFile.name.split('.').pop()
    const photoFileName = `${cpfClean}_photo_${Date.now()}.${photoExt}`

    try {
        const { data: photoUploadData, error: photoUploadError } = await supabase.storage
            .from('photos')
            .upload(photoFileName, photoFile, {
                contentType: photoFile.type,
                upsert: true
            })

        if (photoUploadError) {
            console.error("Erro ao fazer upload da foto:", photoUploadError)

            // Check if it's a bucket not found error
            if (photoUploadError.message?.includes('not found') || photoUploadError.message?.includes('does not exist')) {
                return {
                    success: false,
                    message: "Erro de configuração: O bucket 'photos' não existe no Supabase Storage. Por favor, contate o administrador do sistema."
                }
            }

            // Check for permission errors
            if (photoUploadError.message?.includes('permission') || photoUploadError.message?.includes('policy')) {
                return {
                    success: false,
                    message: "Erro de permissão: Não foi possível fazer upload da foto. Por favor, contate o administrador do sistema."
                }
            }

            return { success: false, message: `Erro ao fazer upload da foto: ${photoUploadError.message}` }
        }
        photoPath = photoUploadData?.path
    } catch (err) {
        console.error("Erro inesperado ao enviar foto:", err)
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
        return { success: false, message: `Erro inesperado ao enviar foto: ${errorMessage}` }
    }

    // Handle Certificate Upload
    const certificateFile = formData.get("certificate") as File | null
    let certificatePath = null

    if (certificateFile && certificateFile.size > 0) {
        // Validation: check file size (e.g. < 5MB)
        if (certificateFile.size > 5 * 1024 * 1024) {
            return { success: false, message: "O arquivo deve ter no máximo 5MB." }
        }

        // Validate file type: accept images (jpg, jpeg, png) and PDF
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        if (!validTypes.includes(certificateFile.type)) {
            return { success: false, message: "Apenas arquivos JPG, PNG ou PDF são permitidos para o certificado." }
        }

        const fileExt = certificateFile.name.split('.').pop()
        const fileIdentifier = cpfClean || rawData.purchaseEmail?.replace(/[@.]/g, '_') || 'foreign'
        const fileName = `${fileIdentifier}_${Date.now()}.${fileExt}`

        try {
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('certificates')
                .upload(fileName, certificateFile, {
                    contentType: certificateFile.type,
                    upsert: true
                })

            if (uploadError) {
                console.error("Erro ao fazer upload do certificado:", uploadError)

                // Check if it's a bucket not found error
                if (uploadError.message?.includes('not found') || uploadError.message?.includes('does not exist')) {
                    return {
                        success: false,
                        message: "Erro de configuração: O bucket 'certificates' não existe no Supabase Storage. Por favor, contate o administrador do sistema."
                    }
                }

                // Check for permission errors
                if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
                    return {
                        success: false,
                        message: "Erro de permissão: Não foi possível fazer upload do certificado. Por favor, contate o administrador do sistema."
                    }
                }

                return { success: false, message: `Erro ao fazer upload do certificado: ${uploadError.message}` }
            }
            certificatePath = uploadData?.path
        } catch (err) {
            console.error("Erro inesperado ao enviar certificado:", err)
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
            return { success: false, message: `Erro inesperado ao enviar certificado: ${errorMessage}` }
        }
    } else {
        // If status is PENDENTE_MANUAL, certificate is required usually.
        if (status === "PENDENTE_MANUAL") {
            // ensure we have a file if it's manual
            // But maybe the client side validation handles this. 
            // Ideally server side too.
            if (!student) { // Only forced if not in student base
                // Actually the logic is: if not in student base => PENDENTE_MANUAL => needs certificate
                // If in student base => AUTO_APROVADA => no certificate needed
                if (!certificateFile || certificateFile.size === 0) {
                    return { success: false, message: "O certificado é obrigatório." }
                }
            }
        }
    }

    // Insert
    const insertData: any = {
        name: rawData.name,
        cpf: cpfClean || null,
        cpf_hash: cpfClean || null,
        whatsapp: rawData.whatsapp,
        email: rawData.email,
        address_json: rawData.address,
        status,
        certificate_file_path: certificatePath || null,
        photo_path: photoPath,
        certification_date: rawData.certificationDate || null,
        is_active: true,
        is_foreign: isForeign,
        maf_pro_id_approved: status === "AUTO_APROVADA",
    }

    // Adicionar card_number e validation_token se aprovado automaticamente
    if (status === "AUTO_APROVADA") {
        insertData.card_number = cardNumber
        insertData.validation_token = validationToken
        insertData.issued_at = new Date().toISOString()
        insertData.maf_pro_id_approved_at = new Date().toISOString()
    }

    const { data: insertedData, error } = await supabase.from("users_cards").insert(insertData).select().single()

    if (error) {
        console.error("Erro ao inserir usuário:", error)
        return { success: false, message: `Erro ao salvar dados: ${error.message || error.code || "verifique os dados e tente novamente."}` }
    }

    if (!insertedData) {
        console.error("Erro ao inserir usuário: insert retornou sem dados")
        return { success: false, message: "Erro ao salvar dados. Tente novamente." }
    }

    // NOVO FLUXO: Sempre enviar email para definir senha (independente do status de validação)
    // O usuário terá acesso ao sistema imediatamente, mas o MAF PRO ID só após validação
    try {
        const emailResult = await sendWelcomeEmail(
            insertedData.id,
            rawData.email as string,
            rawData.name as string,
            status // Passar o status para personalizar o email
        )

        if (!emailResult.success) {
            console.error("Erro ao enviar email de boas-vindas:", emailResult.error)
            // Não retorna erro pois o cadastro foi feito com sucesso
        }
    } catch (emailError: any) {
        console.error("Exceção ao enviar email de boas-vindas:", emailError)
        // Não retorna erro pois o cadastro foi feito com sucesso
    }

    const messageByStatus = {
        "AUTO_APROVADA": "Cadastro realizado! Verifique seu email para definir sua senha. Sua carteirinha já foi aprovada automaticamente e você terá acesso completo ao MAF Pro ID!",
        "PENDENTE_MANUAL": "Cadastro realizado! Verifique seu email para definir sua senha. Você poderá fazer login, mas o acesso ao MAF Pro ID será liberado após validação do seu certificado pela nossa equipe."
    }

    return {
        success: true,
        message: messageByStatus[status as keyof typeof messageByStatus] || "Cadastro realizado com sucesso!",
        status,
        userId: insertedData.id
    }
    } catch (unexpectedError: any) {
        console.error("Erro inesperado em submitApplication:", unexpectedError)
        return {
            success: false,
            message: `Erro inesperado ao processar solicitação: ${unexpectedError?.message || "tente novamente em alguns instantes."}`
        }
    }
}
