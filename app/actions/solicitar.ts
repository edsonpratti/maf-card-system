"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { cleanCPF } from "@/lib/utils"
import { z } from "zod"
import { studentSchema } from "@/lib/validators"

export async function checkCPFExists(cpf: string) {
    const supabase = getServiceSupabase()
    const clean = cleanCPF(cpf)

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
        // Files are handled separately or via upload path sent in formData
        certificatePath: formData.get("certificatePath"),
    }

    const cpfClean = cleanCPF(rawData.cpf as string)

    // Validate again
    // (In real app, re-validate input using Zod)

    // Check base again to determine status
    const { data: student } = await supabase
        .from("students_base")
        .select("id")
        .eq("cpf", cpfClean)
        .single()

    let status = "PENDENTE_MANUAL"
    if (student) {
        status = "AUTO_APROVADA"
        // TODO: Generate PDF and QR here or via queue/trigger
        // For now, allow trigger/cron to pick it up or do it async
    }

    // Insert
    const { error } = await supabase.from("users_cards").insert({
        name: rawData.name,
        cpf: cpfClean,
        cpf_hash: cpfClean, // simplified
        whatsapp: rawData.whatsapp,
        email: rawData.email,
        address_json: rawData.address,
        status,
        certificate_file_path: rawData.certificatePath || null,
        // card details generated later if auto-approved
    })

    if (error) {
        console.error(error)
        return { success: false, message: "Erro ao salvar dados." }
    }

    return { success: true, message: "Solicitação enviada com sucesso!", status }
}
