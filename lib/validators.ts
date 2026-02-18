import { z } from "zod"

export function isValidCPF(cpf: string) {
    if (typeof cpf !== "string") return false
    cpf = cpf.replace(/[^\d]+/g, "")
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
    const cpfDigits = cpf.split("").map((el) => +el)
    const rest = (count: number) =>
        ((cpfDigits.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) * 10) % 11) % 10
    return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10]
}

export const cpfSchema = z.string().refine(isValidCPF, {
    message: "CPF inválido",
})

export const studentSchema = z.object({
    name: z.string().min(3, "Nome muito curto"),
    cpf: cpfSchema,
    whatsapp: z.string().min(10, "WhatsApp inválido"),
    email: z.string().email("Email inválido"),
    certificationDate: z.string().min(1, "Data de habilitação obrigatória"),
    address: z.object({
        cep: z.string().min(8, "CEP inválido"),
        street: z.string().min(3, "Rua inválida"),
        number: z.string().min(1, "Número obrigatório"),
        complement: z.string().optional(),
        neighborhood: z.string().min(3, "Bairro obrigatório"),
        city: z.string().min(3, "Cidade obrigatória"),
        state: z.string().length(2, "UF inválida"),
    }),
})

export type StudentFormData = z.infer<typeof studentSchema>
