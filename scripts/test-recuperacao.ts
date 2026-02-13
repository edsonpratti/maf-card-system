import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import crypto from "crypto"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(__dirname, "../.env.local") })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const resend = new Resend(process.env.RESEND_API_KEY)

async function testRecuperarSenha(email: string) {
  console.log("=== Testando recuperação de senha para:", email, "===")
  console.log("")
  
  // 1. Buscar na users_cards
  console.log("1. Buscando em users_cards...")
  const { data: userCard, error: userCardError } = await supabaseAdmin
    .from("users_cards")
    .select("id, name, email, auth_user_id, first_access_completed")
    .eq("email", email)
    .single()
  
  if (userCardError || !userCard) {
    console.log("❌ Usuário não encontrado em users_cards:", userCardError?.message)
    return
  }
  
  console.log("✅ Encontrado:", userCard.name)
  console.log("   auth_user_id:", userCard.auth_user_id)
  
  // 2. Verificar se tem auth_user_id
  if (!userCard.auth_user_id) {
    console.log("❌ Usuário NÃO está ativado (sem auth_user_id)")
    return
  }
  console.log("✅ Usuário está ativado")
  
  // 3. Verificar no auth.users
  console.log("")
  console.log("2. Buscando em auth.users...")
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (userError) {
    console.log("❌ Erro ao buscar auth.users:", userError.message)
    return
  }
  
  const user = userData.users.find(u => u.email === email)
  if (!user) {
    console.log("❌ Usuário NÃO encontrado em auth.users")
    return
  }
  console.log("✅ Encontrado em auth.users, id:", user.id)
  
  // 4. Gerar token
  console.log("")
  console.log("3. Gerando token...")
  const resetToken = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
  console.log("   Token:", resetToken.substring(0, 20) + "...")
  console.log("   Expira:", expiresAt)
  
  // 5. Salvar token
  console.log("")
  console.log("4. Salvando token no banco...")
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from("password_reset_tokens")
    .insert({
      user_id: user.id,
      email: email,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      used: false
    })
    .select()
  
  if (insertError) {
    console.log("❌ Erro ao salvar token:", insertError.message)
    return
  }
  console.log("✅ Token salvo com sucesso")
  
  // 6. Enviar email
  console.log("")
  console.log("5. Enviando email via Resend...")
  console.log("   API Key:", process.env.RESEND_API_KEY ? "Configurada" : "❌ NÃO CONFIGURADA")
  console.log("   From:", process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com")
  console.log("   To:", email)
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const resetLink = siteUrl + "/recuperar-senha/" + resetToken
  console.log("   Link:", resetLink.substring(0, 60) + "...")
  
  try {
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com",
      to: email,
      subject: "🔒 Recuperação de Senha - MAF Card System",
      html: `<h1>Teste de Recuperação</h1><p>Link: ${resetLink}</p>`
    })
    
    if (emailError) {
      console.log("❌ Erro ao enviar email:", JSON.stringify(emailError, null, 2))
      return
    }
    
    console.log("✅ Email enviado com sucesso!")
    console.log("   Email ID:", emailData?.id)
  } catch (err: any) {
    console.log("❌ Exceção ao enviar email:", err.message)
    console.log("   Stack:", err.stack)
  }
}

// Pegar email do argumento ou usar padrão
const emailToTest = process.argv[2] || "contato@edsonpratti.com.br"
testRecuperarSenha(emailToTest)
