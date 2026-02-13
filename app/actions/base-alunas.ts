"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { verifyAdminAccess } from "@/lib/auth"

const baseSchema = z.object({
    name: z.string().min(3),
    cpf: z.string().length(11), // Clean CPF
})

// Helper function to create audit logs
async function createAuditLog(
    adminUserId: string,
    action: string,
    metadata: any = {}
) {
    const supabase = getServiceSupabase()
    await supabase.from("admin_audit_logs").insert({
        admin_user_id: adminUserId,
        action,
        target_user_id: null,
        metadata,
    })
}

export async function addStudent(prevState: any, formData: FormData) {
    const user = await verifyAdminAccess()
    
    const supabase = getServiceSupabase()
    const name = formData.get("name") as string
    const cpf = (formData.get("cpf") as string).replace(/\D/g, "")

    const parsed = baseSchema.safeParse({ name, cpf })
    if (!parsed.success) {
        return { success: false, message: "Dados inválidos." }
    }

    const { error } = await supabase.from("students_base").insert({
        name,
        cpf,
    })

    if (error) {
        if (error.code === "23505") { // Unique violation
            return { success: false, message: "CPF já existe na base." }
        }
        return { success: false, message: error.message }
    }

    // Log action
    await createAuditLog(user.id, "ADD_STUDENT", { name, cpf })

    revalidatePath("/admin/base-alunas")
    return { success: true, message: "Aluna adicionada!" }
}

export async function importCSV(prevState: any, formData: FormData) {
    const user = await verifyAdminAccess()
    
    const file = formData.get("file") as File
    if (!file) {
        return { success: false, message: "Arquivo obrigatório." }
    }

    const text = await file.text()
    const lines = text.split("\n").slice(1) // Skip header

    const students = []
    for (const line of lines) {
        const [name, cpfRaw] = line.split(",") // Simple CSV parse
        if (name && cpfRaw) {
            const cpf = cpfRaw.replace(/\D/g, "")
            if (cpf.length === 11) {
                students.push({ name: name.trim(), cpf })
            }
        }
    }

    if (students.length === 0) {
        return { success: false, message: "Nenhum aluno válido encontrado." }
    }

    const supabase = getServiceSupabase()
    const { error } = await supabase.from("students_base").upsert(
        students,
        { onConflict: "cpf" }
    )

    if (error) {
        return { success: false, message: "Erro na importação: " + error.message }
    }

    // Log action
    await createAuditLog(user.id, "UPLOAD_CSV", { count: students.length, fileName: file.name })

    revalidatePath("/admin/base-alunas")
    return { success: true, message: `${students.length} alunas importadas!` }
}

export async function deleteStudent(id: string) {
    const user = await verifyAdminAccess()
    
    const supabase = getServiceSupabase()
    
    // Get student info before deleting
    const { data: student } = await supabase
        .from("students_base")
        .select("name, cpf")
        .eq("id", id)
        .single()
    
    await supabase.from("students_base").delete().eq("id", id)
    
    // Log action
    if (student) {
        await createAuditLog(user.id, "DELETE_STUDENT", { name: student.name, cpf: student.cpf })
    }
    
    revalidatePath("/admin/base-alunas")
}

export async function updateStudent(id: string, name: string, cpf: string) {
    const user = await verifyAdminAccess()
    
    const supabase = getServiceSupabase()
    
    // Limpar CPF
    const cleanCpf = cpf.replace(/\D/g, "")
    
    if (cleanCpf.length !== 11) {
        return { success: false, message: "CPF inválido" }
    }
    
    if (name.length < 3) {
        return { success: false, message: "Nome deve ter pelo menos 3 caracteres" }
    }
    
    // Get current data for logging
    const { data: oldData } = await supabase
        .from("students_base")
        .select("name, cpf")
        .eq("id", id)
        .single()
    
    // Check if CPF already exists (for another student)
    const { data: existingStudent } = await supabase
        .from("students_base")
        .select("id")
        .eq("cpf", cleanCpf)
        .neq("id", id)
        .single()
    
    if (existingStudent) {
        return { success: false, message: "CPF já cadastrado para outra aluna" }
    }
    
    const { error } = await supabase
        .from("students_base")
        .update({ name, cpf: cleanCpf, updated_at: new Date().toISOString() })
        .eq("id", id)
    
    if (error) {
        return { success: false, message: error.message }
    }
    
    // Log action
    await createAuditLog(user.id, "UPDATE_STUDENT", { 
        id,
        oldName: oldData?.name,
        oldCpf: oldData?.cpf,
        newName: name,
        newCpf: cleanCpf
    })
    
    revalidatePath("/admin/base-alunas")
    return { success: true, message: "Aluna atualizada com sucesso!" }
}

export async function getStudentById(id: string) {
    await verifyAdminAccess()
    
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
        .from("students_base")
        .select("*")
        .eq("id", id)
        .single()
    
    if (error) {
        return null
    }
    
    return data
}
