"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminAccess, getCurrentUser } from "@/lib/auth"
import { Resend } from "resend"
import { resendPasswordEmailTemplate } from "@/lib/email-templates-admin"

export async function getAdminUsers() {
  await verifyAdminAccess()
  const supabase = getServiceSupabase()

  // Busca admins da tabela admin_users
  const { data: tableAdmins, error: tableError } = await supabase
    .from("admin_users")
    .select("id, name, email, created_at")
    .order("created_at", { ascending: false })

  // Obtém o usuário atual para incluir se for admin por metadados
  const currentUser = await getCurrentUser()
  const metadataAdmins = []

  if (currentUser && (currentUser.user_metadata?.is_admin === true || currentUser.app_metadata?.is_admin === true)) {
    // Verifica se já não está na tabela admin_users
    const alreadyInTable = (tableAdmins || []).some(admin => admin.email === currentUser.email)
    if (!alreadyInTable) {
      metadataAdmins.push({
        id: `auth-${currentUser.id}`,
        name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Admin',
        email: currentUser.email || '',
        created_at: currentUser.created_at,
        source: 'auth' // indica que vem dos metadados
      })
    }
  }

  // Combina as listas
  const allAdmins = [...(tableAdmins || []), ...metadataAdmins]

  return allAdmins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function createAdminUser(name: string, email: string, password: string) {
  await verifyAdminAccess()
  const supabase = getServiceSupabase()

  // 1. Cria o usuário no Supabase Auth com a flag is_admin
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, is_admin: true },
    app_metadata: { is_admin: true },
  })

  if (authError) {
    // Se o usuário já existe no Auth, apenas atualiza os metadados
    if (!authError.message.includes("already been registered")) {
      return { success: false, message: authError.message }
    }

    // Usuário já existe no Auth — garante que é_admin está nos metadados
    const { data: listData } = await supabase.auth.admin.listUsers()
    const existingUser = listData?.users.find(u => u.email === email)
    if (existingUser) {
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: { ...existingUser.user_metadata, name, is_admin: true },
        app_metadata: { ...existingUser.app_metadata, is_admin: true },
      })
    }
  }

  // 2. Registra na tabela admin_users (sem senha em texto puro)
  const { error: tableError } = await supabase
    .from("admin_users")
    .upsert({ name, email }, { onConflict: "email" })
    .select()
    .single()

  if (tableError) return { success: false, message: tableError.message }
  return { success: true, message: "Administrador cadastrado com sucesso!" }
}

export async function resetAdminPassword(email: string) {
  await verifyAdminAccess()
  const supabase = getServiceSupabase()

  // Verifica se o usuário existe no Auth e é admin
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) return { success: false, message: "Erro ao buscar usuários" }

  const user = listData.users.find(u => u.email === email)
  if (!user) return { success: false, message: "Usuário não encontrado no sistema de autenticação" }

  const isAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
  if (!isAdmin) return { success: false, message: "Usuário não é administrador" }

  // Gera link de recuperação de senha
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${siteUrl}/admin/login`,
    },
  })

  if (linkError) return { success: false, message: linkError.message }

  const resetLink = linkData?.properties?.action_link
  if (!resetLink) return { success: false, message: "Erro ao gerar link de recuperação" }

  // Envia o email com o link
  const resend = new Resend(process.env.RESEND_API_KEY)
  const name = user.user_metadata?.name || email.split("@")[0]
  const htmlContent = resendPasswordEmailTemplate(name, resetLink)

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "mafpro@amandafernandes.com",
    to: email,
    subject: "🔒 Redefinição de Senha - MAF Card System",
    html: htmlContent,
  })

  if (emailError) return { success: false, message: "Erro ao enviar email de recuperação" }

  return { success: true, message: `Link de redefinição enviado para ${email}` }
}
