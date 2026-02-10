import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(__dirname, "../.env.local") })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testValidation() {
    console.log("🔍 Testando validação do token de recuperação de senha...\n")
    
    // Buscar o token mais recente válido
    const { data: tokens, error } = await supabaseAdmin
        .from("password_reset_tokens")
        .select("*")
        .eq("email", "contato@edsonpratti.com.br")
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
    
    if (error) {
        console.log("❌ Erro ao buscar token:", error)
        return
    }
    
    if (!tokens || tokens.length === 0) {
        console.log("❌ Nenhum token encontrado")
        return
    }
    
    const token = tokens[0]
    console.log("📋 Token encontrado:")
    console.log("   ID:", token.id)
    console.log("   Token completo:", token.token)
    console.log("   Email:", token.email)
    console.log("   Usado:", token.used)
    
    const now = new Date()
    const expiresAt = new Date(token.expires_at)
    console.log("   Agora:", now.toISOString())
    console.log("   Expira:", expiresAt.toISOString())
    console.log("   Expirado?", now > expiresAt)
    
    // Testar a mesma query que o código usa
    console.log("\n🔍 Testando query de validação (igual ao código)...")
    const { data: validationData, error: validationError } = await supabaseAdmin
        .from("password_reset_tokens")
        .select("*")
        .eq("token", token.token)
        .eq("used", false)
        .single()
    
    if (validationError) {
        console.log("❌ Erro na validação:", validationError)
    } else if (validationData) {
        console.log("✅ Query de validação OK: Token encontrado")
        
        // Verificar expiração como o código faz
        const checkNow = new Date()
        const checkExpires = new Date(validationData.expires_at)
        
        if (checkNow > checkExpires) {
            console.log("⚠️  Token EXPIRADO segundo a lógica do código")
        } else {
            console.log("✅ Token VÁLIDO segundo a lógica do código")
        }
    } else {
        console.log("❌ Token não encontrado")
    }
    
    console.log("\n🔗 URL de recuperação:")
    console.log(`   ${process.env.NEXT_PUBLIC_SITE_URL}/recuperar-senha/${token.token}`)
    
    console.log("\n📝 Copie e cole no navegador para testar!")
}

testValidation()
