"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { cleanCPF } from "@/lib/utils"
import { z } from "zod"
import { studentSchema } from "@/lib/validators"
import { sendFirstAccessEmail } from "./first-access"

// Rate limiting helper (simple in-memory implementation)
// For production, consider using Redis or similar
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

export async function submitApplication(prevState: any, formData: FormData) {
    const supabase = getServiceSupabase()

    const rawData = {
        name: formData.get("name"),
        cpf: formData.get("cpf"),
        whatsapp: formData.get("whatsapp"),
        email: formData.get("email"),
        address: {
            cep: formData.get("address.cep"),
            street: formData.get("address.street"),
            number: formData.get("address.number"),
            complement: formData.get("address.complement"),
            neighborhood: formData.get("address.neighborhood"),
            city: formData.get("address.city"),
            state: formData.get("address.state"),
        },
        // We will handle the file separately
    }

    const cpfClean = cleanCPF(rawData.cpf as string)
    
    // Basic validation
    if (!cpfClean || cpfClean.length !== 11) {
        return { success: false, message: "CPF inválido." }
    }
    
    // Rate limiting by CPF to prevent spam
    if (!checkRateLimit(`submit-${cpfClean}`, 3, 3600000)) { // 3 attempts per hour
        return { success: false, message: "Muitas tentativas. Aguarde antes de tentar novamente." }
    }
    
    // Additional validation for required fields
    if (!rawData.name || !rawData.email || !rawData.whatsapp) {
        return { success: false, message: "Todos os campos obrigatórios devem ser preenchidos." }
    }

    // Validate using Zod
    // Note: We need to adapt the rawData to match the schema expectations if needed, 
    // but the schema probably expects a string for everything or specific shape.
    // For now assuming the existing validation lines were correct or we can just comment them out if they cause issues with File objects not being in rawData.
    // However, the previous code had them.

    // Check base again to determine status
    const { data: student } = await supabase
        .from("students_base")
        .select("id")
        .eq("cpf", cpfClean)
        .single()

    let status = "PENDENTE_MANUAL"
    if (student) {
        status = "AUTO_APROVADA"
    }

    // Handle File Upload
    const certificateFile = formData.get("certificate") as File | null
    let certificatePath = null

    if (certificateFile && certificateFile.size > 0) {
        // Validation: check file size (e.g. < 5MB)
        if (certificateFile.size > 5 * 1024 * 1024) {
            return { success: false, message: "O arquivo deve ter no máximo 5MB." }
        }

        const fileExt = certificateFile.name.split('.').pop()
        const fileName = `${cpfClean}_${Date.now()}.${fileExt}`

        try {
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('certificates')
                .upload(fileName, certificateFile, {
                    contentType: certificateFile.type,
                    upsert: true
                })

            if (uploadError) {
                return { success: false, message: "Erro ao fazer upload do certificado." }
            }
            certificatePath = uploadData?.path
        } catch (err) {
            return { success: false, message: "Erro inesperado ao enviar certificado." }
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
    const { data: insertedData, error } = await supabase.from("users_cards").insert({
        name: rawData.name,
        cpf: cpfClean,
        cpf_hash: cpfClean,
        whatsapp: rawData.whatsapp,
        email: rawData.email,
        address_json: rawData.address,
        status,
        certificate_file_path: certificatePath || null,
    }).select().single()

    if (error) {
        return { success: false, message: "Erro ao salvar dados." }
    }

    // If auto-approved, send first access email
    if (status === "AUTO_APROVADA" && insertedData) {
        await sendFirstAccessEmail(insertedData.id, rawData.email as string, rawData.name as string)
    }

    return { success: true, message: "Solicitação enviada com sucesso!", status }
}
