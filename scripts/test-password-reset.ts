import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, "../.env.local") })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

async function testPasswordResetTokens() {
    console.log("🔍 Testando tabela password_reset_tokens...")
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("")

    try {
        // 1. Verificar se a tabela existe
        const { data: tables, error: tablesError } = await supabaseAdmin
            .from("password_reset_tokens")
            .select("*")
            .limit(1)

        if (tablesError) {
            console.error("❌ Erro ao acessar tabela:", tablesError)
            console.error("Código:", tablesError.code)
            console.error("Detalhes:", tablesError.details)
            console.error("Mensagem:", tablesError.message)
            
            if (tablesError.code === "42P01") {
                console.log("\n⚠️  A tabela 'password_reset_tokens' NÃO EXISTE!")
                console.log("Execute a migration: migrations/add-password-reset-tokens.sql")
            }
            return
        }

        console.log("✅ Tabela password_reset_tokens existe!")
        console.log(`Total de registros: ${tables?.length || 0}`)
        
        // 2. Listar todos os tokens
        const { data: allTokens, error: listError } = await supabaseAdmin
            .from("password_reset_tokens")
            .select("*")
            .order("created_at", { ascending: false })
            
        if (listError) {
            console.error("❌ Erro ao listar tokens:", listError)
            return
        }

        if (allTokens && allTokens.length > 0) {
            console.log("\n📋 Tokens encontrados:")
            allTokens.forEach((token, index) => {
                const now = new Date()
                const expiresAt = new Date(token.expires_at)
                const isExpired = now > expiresAt
                const status = token.used ? "USADO" : isExpired ? "EXPIRADO" : "VÁLIDO"
                
                console.log(`\n${index + 1}. Token ID: ${token.id}`)
                console.log(`   Email: ${token.email}`)
                console.log(`   Token: ${token.token.substring(0, 20)}...`)
                console.log(`   Criado: ${new Date(token.created_at).toLocaleString("pt-BR")}`)
                console.log(`   Expira: ${expiresAt.toLocaleString("pt-BR")}`)
                console.log(`   Status: ${status}`)
                if (token.used_at) {
                    console.log(`   Usado em: ${new Date(token.used_at).toLocaleString("pt-BR")}`)
                }
            })
        } else {
            console.log("\n📭 Nenhum token encontrado na tabela.")
        }

    } catch (error) {
        console.error("❌ Erro inesperado:", error)
    }
}

testPasswordResetTokens()
