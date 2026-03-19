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

const addressSchema = z.object({
    cep: z.string().min(8, "CEP inválido"),
    street: z.string().min(3, "Rua inválida"),
    number: z.string().min(1, "Número obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(3, "Bairro obrigatório"),
    city: z.string().min(3, "Cidade obrigatória"),
    state: z.string().length(2, "UF inválida"),
    country: z.string().optional(),
})

// Schema flexível para endereço de estrangeiros (sem CEP brasileiro, com país obrigatório)
const foreignAddressSchema = z.object({
    cep: z.string().optional(),
    street: z.string().min(3, "Endereço inválido"),
    number: z.string().min(1, "Número obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().min(2, "Cidade obrigatória"),
    state: z.string().optional(),
    country: z.string().min(2, "País obrigatório"),
})

export const studentSchema = z.object({
    name: z.string().min(3, "Nome muito curto"),
    cpf: cpfSchema,
    whatsapp: z.string().min(10, "WhatsApp inválido"),
    email: z.string().email("Email inválido"),
    certificationDate: z.string().min(1, "Data de habilitação obrigatória"),
    address: addressSchema,
})

export type StudentFormData = z.infer<typeof studentSchema>

// Schema para o fluxo combinado (brasileira com CPF ou estrangeira com email de compra)
export const studentCombinedSchema = z.object({
    isForeign: z.boolean(),
    cpf: z.string().optional(),
    purchaseEmail: z.string().optional(),
    name: z.string().min(3, "Nome muito curto"),
    whatsapp: z.string().min(4, "Telefone/WhatsApp inválido"),
    email: z.string().email("Email inválido"),
    certificationDate: z.string().min(1, "Data de habilitação obrigatória"),
    address: z.union([addressSchema, foreignAddressSchema]),
}).superRefine((data, ctx) => {
    if (!data.isForeign) {
        // Validações para brasileiros
        if (!data.cpf || !isValidCPF(data.cpf)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "CPF inválido",
                path: ["cpf"],
            })
        }
        // WhatsApp brasileiro deve ter pelo menos 10 dígitos
        const whatsappDigits = data.whatsapp.replace(/\D/g, "")
        if (whatsappDigits.length < 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "WhatsApp inválido (mínimo 10 dígitos)",
                path: ["whatsapp"],
            })
        }
        // Endereço brasileiro precisa de CEP e bairro
        if (!data.address.cep || data.address.cep.replace(/\D/g, "").length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "CEP inválido",
                path: ["address", "cep"],
            })
        }
        if (!data.address.neighborhood || data.address.neighborhood.length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Bairro obrigatório",
                path: ["address", "neighborhood"],
            })
        }
        if (!data.address.state || data.address.state.length !== 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "UF inválida",
                path: ["address", "state"],
            })
        }
    } else {
        // Validações para estrangeiros
        if (!data.purchaseEmail || !z.string().email().safeParse(data.purchaseEmail).success) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Email de compra inválido",
                path: ["purchaseEmail"],
            })
        }
        // Telefone internacional precisa de pelo menos 4 dígitos
        const phoneDigits = data.whatsapp.replace(/\D/g, "")
        if (phoneDigits.length < 4) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Telefone inválido",
                path: ["whatsapp"],
            })
        }
        // Endereço estrangeiro precisa de país
        if (!data.address.country || data.address.country.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "País obrigatório",
                path: ["address", "country"],
            })
        }
    }
})

export type StudentCombinedFormData = z.infer<typeof studentCombinedSchema>
