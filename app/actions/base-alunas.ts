"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { verifyAdminAccess } from "@/lib/auth"

const baseSchema = z.object({
    name: z.string().min(3),
    cpf: z.string().length(11), // Clean CPF
})

export async function addStudent(prevState: any, formData: FormData) {
    await verifyAdminAccess()
    
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

    revalidatePath("/admin/base-alunas")
    return { success: true, message: "Aluna adicionada!" }
}

export async function importCSV(prevState: any, formData: FormData) {
    await verifyAdminAccess()
    
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

    revalidatePath("/admin/base-alunas")
    return { success: true, message: `${students.length} alunas importadas!` }
}

export async function deleteStudent(id: string) {
    await verifyAdminAccess()
    
    const supabase = getServiceSupabase()
    await supabase.from("students_base").delete().eq("id", id)
    revalidatePath("/admin/base-alunas")
}
