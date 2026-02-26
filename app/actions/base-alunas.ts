"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { verifyAdminAccess } from "@/lib/auth"

const baseSchema = z.object({
    name: z.string().min(3),
    cpf: z.string().length(11).optional(), // Clean CPF — opcional para estrangeiras
    email: z.string().email().optional(),   // Email — obrigatório para estrangeiras
    is_foreign: z.boolean().default(false),
}).refine((d) => d.is_foreign ? !!d.email : !!d.cpf, {
    message: "CPF é obrigatório para brasileiras; email é obrigatório para estrangeiras",
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
    try {
        const user = await verifyAdminAccess()
        
        const supabase = getServiceSupabase()
        const name = formData.get("name") as string
        const isForeign = formData.get("is_foreign") === "true"
        const cpf = isForeign ? undefined : (formData.get("cpf") as string).replace(/\D/g, "")
        const email = isForeign ? (formData.get("email") as string)?.trim().toLowerCase() : undefined

        const parsed = baseSchema.safeParse({ name, cpf, email, is_foreign: isForeign })
        if (!parsed.success) {
            return { success: false, message: "Dados inválidos." }
        }

        const insertPayload: any = { name, is_foreign: isForeign }
        if (!isForeign) insertPayload.cpf = cpf
        if (email) insertPayload.email = email

        const { error } = await supabase.from("students_base").insert(insertPayload)

        if (error) {
            console.error("Database error:", error)
            if (error.code === "23505") { // Unique violation
                return { success: false, message: isForeign ? "Email já existe na base." : "CPF já existe na base." }
            }
            return { success: false, message: error.message }
        }

        // Log action (don't let audit log errors prevent success)
        try {
            await createAuditLog(user.id, "ADD_STUDENT", { name, isForeign })
        } catch (auditError) {
            console.error("Erro ao criar audit log:", auditError)
            // Continue even if audit log fails
        }

        // Revalidate after successful operation
        try {
            revalidatePath("/admin/base-alunas")
        } catch (revalidateError) {
            console.error("Erro ao revalidar path:", revalidateError)
            // Continue even if revalidation fails
        }
        
        return { success: true, message: "Aluna adicionada!" }
    } catch (error) {
        console.error("Erro em addStudent:", error)
        return { success: false, message: "Erro inesperado ao adicionar aluna." }
    }
}

export async function importCSV(prevState: any, formData: FormData) {
    try {
        const user = await verifyAdminAccess()
        
        const file = formData.get("file") as File
        if (!file) {
            return { success: false, message: "Arquivo obrigatório." }
        }

        let text = await file.text()
        // Remove BOM (UTF-8 with BOM) if present
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1)
        }
        // Normalize line endings (CRLF → LF)
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
        
        const lines = text.split("\n")
        const headerLine = lines[0]?.trim() || ""
        const dataLines = lines.slice(1) // Skip header

        // Auto-detect delimiter
        const headerDelimiter = headerLine.includes(";") ? ";" : ","

        // Auto-detect column order from header
        // Supported formats:
        //   nome,cpf,email  (default)
        //   nome,email,cpf  (e.g. Hotmart export: "Comprador(a);Email;Documento")
        const headerParts = headerLine.split(headerDelimiter).map((h) => h.trim().toLowerCase())
        const colName  = headerParts.findIndex((h) => h.includes("nome") || h.includes("comprador") || h.includes("alun"))
        const colEmail = headerParts.findIndex((h) => h.includes("email") || h.includes("e-mail"))
        const colCpf   = headerParts.findIndex((h) => h.includes("cpf") || h.includes("documento") || h.includes("doc"))

        // Fallback: se o cabeçalho não foi reconhecido, assume nome(0),cpf(1),email(2)
        const idxName  = colName  >= 0 ? colName  : 0
        const idxCpf   = colCpf   >= 0 ? colCpf   : 1
        const idxEmail = colEmail >= 0 ? colEmail : 2

        const students = []
        const invalidRows = []
        
        for (let lineIndex = 0; lineIndex < dataLines.length; lineIndex++) {
            const line = dataLines[lineIndex].trim()
            if (!line) continue // Skip empty lines
            
            // Detect delimiter (comma or semicolon)
            const delimiter = line.includes(";") ? ";" : ","
            const parts = line.split(delimiter)
            
            if (parts.length < 2) continue
            
            const name     = parts[idxName]?.trim()
            const cpfRaw   = parts[idxCpf]?.trim() || ""
            const emailRaw = parts[idxEmail]?.trim().toLowerCase() || ""

            if (!name) continue

            // Detect scientific notation CPFs (e.g. "5,07629E+13" from Excel)
            // These cannot be recovered — flag them as invalid
            if (cpfRaw && /^\d[\d,.]?[\d,.\s]*[eE][+\-]?\d+$/.test(cpfRaw)) {
                invalidRows.push(`Linha ${lineIndex + 2}: CPF em notação científica para "${name}" — abra o arquivo CSV em um editor de texto (não Excel) e salve novamente antes de importar`)
                continue
            }

            // Determine if this is a foreign student
            // A row is foreign when CPF is empty/absent but email is present
            const cpfCleaned = cpfRaw.replace(/[,.\s\-\/]/g, "").replace(/\D/g, "")
            const isForeign = !cpfCleaned && !!emailRaw

            if (isForeign) {
                // Foreign student: validate email
                if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
                    invalidRows.push(`Linha ${lineIndex + 2}: Email inválido para estrangeira "${name}"`)
                    continue
                }
                if (name.length < 3) {
                    invalidRows.push(`Linha ${lineIndex + 2}: Nome muito curto`)
                    continue
                }
                students.push({ name, cpf: null, email: emailRaw, is_foreign: true })
                continue
            }

            // Brazilian student: validate CPF
            if (!cpfCleaned) {
                invalidRows.push(`Linha ${lineIndex + 2}: CPF e email ausentes`)
                continue
            }
            
            // Skip if CPF is completely empty after cleaning
            let cpfFinal = cpfCleaned

            // If longer than 11, take last 11 digits
            if (cpfFinal.length > 11) {
                cpfFinal = cpfFinal.slice(-11)
            }
            
            // If shorter than 11, pad with leading zeros
            if (cpfFinal.length < 11) {
                cpfFinal = cpfFinal.padStart(11, "0")
            }
            
            // Skip all-zero CPFs (invalid)
            if (cpfFinal === "00000000000") {
                invalidRows.push(`Linha ${lineIndex + 2}: CPF inválido para "${name}"`)
                continue
            }
            
            if (cpfFinal.length === 11 && name.length >= 3) {
                students.push({ name, cpf: cpfFinal, email: emailRaw || null, is_foreign: false })
            } else if (cpfFinal.length !== 11) {
                invalidRows.push(`Linha ${lineIndex + 2}: CPF com comprimento inválido (${cpfFinal.length} dígitos)`)
            } else {
                invalidRows.push(`Linha ${lineIndex + 2}: Nome muito curto`)
            }
        }

        if (students.length === 0) {
            let errorMsg = "Nenhum aluno válido encontrado."
            if (invalidRows.length > 0) {
                errorMsg += `\n\nProblemas encontrados:\n${invalidRows.slice(0, 5).join("\n")}`
                if (invalidRows.length > 5) {
                    errorMsg += `\n... e mais ${invalidRows.length - 5} problemas`
                }
            }
            return { success: false, message: errorMsg }
        }

        const supabase = getServiceSupabase()
        // Deduplicar dentro do lote (mesmo CPF/email pode aparecer várias vezes no CSV
        // se a aluna comprou o curso mais de uma vez — mantém apenas a primeira ocorrência)
        const seenCpfs = new Set<string>()
        const seenEmails = new Set<string>()
        const dedupedStudents = students.filter((s) => {
            if (!s.is_foreign && s.cpf) {
                if (seenCpfs.has(s.cpf)) return false
                seenCpfs.add(s.cpf)
            } else if (s.is_foreign && s.email) {
                if (seenEmails.has(s.email)) return false
                seenEmails.add(s.email)
            }
            return true
        })

        // Inserir brasileiras por CPF e estrangeiras por email (separados)
        // Nota: o índice único de CPF é parcial (WHERE cpf IS NOT NULL), portanto
        // ON CONFLICT não é suportado via cliente — filtramos previamente os duplicados.
        const brazilians = dedupedStudents.filter((s) => !s.is_foreign)
        const foreigners = dedupedStudents.filter((s) => s.is_foreign)

        if (brazilians.length > 0) {
            // Busca apenas os CPFs do lote atual que já existem na base
            // (evita buscar todos os registros, que pode exceder o limite de 1000 do Supabase)
            const cpfsNoBatch = brazilians.map((s) => s.cpf).filter(Boolean) as string[]
            const { data: existingCpfRows } = await supabase
                .from("students_base")
                .select("cpf")
                .in("cpf", cpfsNoBatch)
            const existingCpfs = new Set((existingCpfRows || []).map((r: any) => r.cpf))
            const newBrazilians = brazilians.filter((s) => s.cpf && !existingCpfs.has(s.cpf))

            if (newBrazilians.length > 0) {
                const { error } = await supabase.from("students_base").insert(newBrazilians)
                if (error) {
                    return { success: false, message: "Erro na importação (brasileiras): " + error.message }
                }
            }
        }

        if (foreigners.length > 0) {
            // Busca apenas os emails do lote atual que já existem na base
            const emailsNoBatch = foreigners.map((s) => s.email).filter(Boolean) as string[]
            const { data: existingEmailRows } = await supabase
                .from("students_base")
                .select("email")
                .in("email", emailsNoBatch)
            const existingEmails = new Set((existingEmailRows || []).map((r: any) => r.email))
            const newForeigners = foreigners.filter((s) => s.email && !existingEmails.has(s.email))

            if (newForeigners.length > 0) {
                const { error } = await supabase.from("students_base").insert(newForeigners)
                if (error) {
                    return { success: false, message: "Erro na importação (estrangeiras): " + error.message }
                }
            }
        }

        // Log action (don't let audit log errors prevent success)
        const dupCount = students.length - dedupedStudents.length
        try {
            await createAuditLog(user.id, "UPLOAD_CSV", { 
                count: dedupedStudents.length, 
                fileName: file.name,
                skipped: invalidRows.length,
                duplicates: dupCount,
                foreigners: foreigners.length,
            })
        } catch (auditError) {
            console.error("Erro ao criar audit log:", auditError)
            // Continue even if audit log fails
        }

        // Revalidate after successful operation
        try {
            revalidatePath("/admin/base-alunas")
        } catch (revalidateError) {
            console.error("Erro ao revalidar path:", revalidateError)
            // Continue even if revalidation fails
        }
        
        const foreignCount = foreigners.length
        let message = `${dedupedStudents.length} alunas importadas!`
        if (foreignCount > 0) message += ` (${foreignCount} estrangeiras)`
        if (dupCount > 0) message += `\nℹ️ ${dupCount} duplicatas no arquivo foram ignoradas`
        if (invalidRows.length > 0) {
            message += `\n⚠️ ${invalidRows.length} linhas foram ignoradas (dados inválidos ou incompletos)`
        }
        return { success: true, message }
    } catch (error) {
        console.error("Erro em importCSV:", error)
        return { success: false, message: "Erro inesperado ao importar CSV." }
    }
}

export async function deleteStudent(id: string) {
    try {
        const user = await verifyAdminAccess()
        
        const supabase = getServiceSupabase()
        
        // Get student info before deleting
        const { data: student } = await supabase
            .from("students_base")
            .select("name, cpf, email, is_foreign")
            .eq("id", id)
            .single()
        
        const { error } = await supabase.from("students_base").delete().eq("id", id)
        
        if (error) {
            console.error("Erro ao deletar aluna:", error)
            throw error
        }
        
        // Log action (don't let audit log errors prevent success)
        if (student) {
            try {
                await createAuditLog(user.id, "DELETE_STUDENT", { 
                    name: student.name, 
                    cpf: student.cpf,
                    email: student.email,
                    is_foreign: student.is_foreign,
                })
            } catch (auditError) {
                console.error("Erro ao criar audit log:", auditError)
                // Continue even if audit log fails
            }
        }
        
        // Revalidate after successful operation
        try {
            revalidatePath("/admin/base-alunas")
        } catch (revalidateError) {
            console.error("Erro ao revalidar path:", revalidateError)
            // Continue even if revalidation fails
        }
    } catch (error) {
        console.error("Erro em deleteStudent:", error)
        throw error
    }
}

export async function updateStudent(id: string, name: string, cpf: string, email?: string, isForeign?: boolean) {
    try {
        const user = await verifyAdminAccess()
        
        const supabase = getServiceSupabase()
        
        const foreign = isForeign ?? false

        // Limpar CPF (apenas para brasileiras)
        const cleanCpf = foreign ? null : cpf.replace(/\D/g, "")
        const cleanEmail = email?.trim().toLowerCase() || null
        
        if (!foreign && (!cleanCpf || cleanCpf.length !== 11)) {
            return { success: false, message: "CPF inválido" }
        }

        if (foreign && !cleanEmail) {
            return { success: false, message: "Email é obrigatório para estrangeiras" }
        }
        
        if (name.length < 3) {
            return { success: false, message: "Nome deve ter pelo menos 3 caracteres" }
        }
        
        // Get current data for logging
        const { data: oldData } = await supabase
            .from("students_base")
            .select("name, cpf, email, is_foreign")
            .eq("id", id)
            .single()
        
        if (!foreign) {
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
        }
        
        const updatePayload: any = { 
            name, 
            is_foreign: foreign, 
            updated_at: new Date().toISOString() 
        }
        if (!foreign) {
            updatePayload.cpf = cleanCpf
        }
        if (cleanEmail) {
            updatePayload.email = cleanEmail
        }

        const { error } = await supabase
            .from("students_base")
            .update(updatePayload)
            .eq("id", id)
        
        if (error) {
            return { success: false, message: error.message }
        }
        
        // Log action (don't let audit log errors prevent success)
        try {
            await createAuditLog(user.id, "UPDATE_STUDENT", { 
                id,
                oldName: oldData?.name,
                oldCpf: oldData?.cpf,
                oldEmail: oldData?.email,
                newName: name,
                newCpf: cleanCpf,
                newEmail: cleanEmail,
                is_foreign: foreign,
            })
        } catch (auditError) {
            console.error("Erro ao criar audit log:", auditError)
            // Continue even if audit log fails
        }
        
        // Revalidate after successful operation
        try {
            revalidatePath("/admin/base-alunas")
        } catch (revalidateError) {
            console.error("Erro ao revalidar path:", revalidateError)
            // Continue even if revalidation fails
        }
        
        return { success: true, message: "Aluna atualizada com sucesso!" }
    } catch (error) {
        console.error("Erro em updateStudent:", error)
        return { success: false, message: "Erro inesperado ao atualizar aluna." }
    }
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

/**
 * Busca todos os alunos da base
 */
export async function getStudentsBase(params?: {
    page?: number
    pageSize?: number
    search?: string
    searchCPF?: string
}) {
    await verifyAdminAccess()

    const supabase = getServiceSupabase()
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 50
    const search = params?.search?.trim() ?? ""
    const searchCPF = params?.searchCPF?.trim().replace(/\D/g, "") ?? ""

    // Query paginada com filtros
    let query = supabase
        .from("students_base")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

    if (search) {
        query = query.ilike("name", `%${search}%`)
    }

    if (searchCPF) {
        // Busca por CPF (numérico) ou email (texto)
        query = query.or(`cpf.ilike.%${searchCPF}%,email.ilike.%${searchCPF}%`)
    }

    const { data, error, count } = await query

    if (error) {
        console.error("Erro ao buscar alunos da base:", error)
        return { data: [], total: 0, totalBrazilians: 0, totalForeigners: 0 }
    }

    // Contagens totais sem filtros (para os cards de resumo)
    const { count: totalAll } = await supabase
        .from("students_base")
        .select("*", { count: "exact", head: true })

    const { count: totalForeigners } = await supabase
        .from("students_base")
        .select("*", { count: "exact", head: true })
        .eq("is_foreign", true)

    const all = totalAll ?? 0
    const foreign = totalForeigners ?? 0

    return {
        data: data || [],
        total: count ?? 0,
        totalBrazilians: all - foreign,
        totalForeigners: foreign,
    }
}
