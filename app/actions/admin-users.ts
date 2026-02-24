"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminAccess, getCurrentUser } from "@/lib/auth"
import { Resend } from "resend"
import { resendPasswordEmailTemplate } from "@/lib/email-templates-admin"
import type { AdminRole, AdminPermission } from "@/lib/admin-permissions"

/**
 * Retorna o papel e as permissões do admin atualmente logado.
 * Se o admin não estiver na tabela admin_users mas tiver is_admin=true
 * nos metadados (criado via Supabase Dashboard), é tratado como master.
 */
export async function getMyAdminInfo(): Promise<{ role: AdminRole; permissions: AdminPermission[] } | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const isAdminUser =
    user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
  if (!isAdminUser) return null

  const supabase = getServiceSupabase()
  const { data } = await supabase
    .from("admin_users")
    .select("role, permissions")
    .eq("email", user.email!)
    .single()

  if (!data) {
    return { role: "master", permissions: [] }
  }

  return {
    role: (data.role as AdminRole) ?? "master",
    permissions: (data.permissions as AdminPermission[]) ?? [],
  }
}

export async function getAdminUsers() {
  await verifyAdminAccess()
  const supabase = getServiceSupabase()

  const { data: tableAdmins } = await supabase
    .from("admin_users")
    .select("id, name, email, role, permissions, created_by_email, created_at")
    .order("created_at", { ascending: false })

  const currentUser = await getCurrentUser()
  const metadataAdmins: any[] = []

  if (
    currentUser &&
    (currentUser.user_metadata?.is_admin === true ||
      currentUser.app_metadata?.is_admin === true)
  ) {
    const alreadyInTable = (tableAdmins || []).some(
      (admin) => admin.email === currentUser.email
    )
    if (!alreadyInTable) {
      metadataAdmins.push({
        id: `auth-${currentUser.id}`,
        name:
          currentUser.user_metadata?.name ||
          currentUser.email?.split("@")[0] ||
          "Admin",
        email: currentUser.email || "",
        role: "master" as AdminRole,
        permissions: [] as AdminPermission[],
        created_by_email: null,
        created_at: currentUser.created_at,
        source: "auth",
      })
    }
  }

  const allAdmins = [...(tableAdmins || []), ...metadataAdmins]
  return allAdmins.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function createAdminUser(
  name: string,
  email: string,
  password: string,
  role: AdminRole = "operator",
  permissions: AdminPermission[] = []
) {
  await verifyAdminAccess()

  const myInfo = await getMyAdminInfo()
  if (myInfo?.role !== "master") {
    return {
      success: false,
      message: "Apenas administradores master podem cadastrar novos admins.",
    }
  }

  const currentUser = await getCurrentUser()
  const supabase = getServiceSupabase()

  const { error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, is_admin: true, admin_role: role },
    app_metadata: { is_admin: true, admin_role: role },
  })

  if (authError) {
    if (!authError.message.includes("already been registered")) {
      return { success: false, message: authError.message }
    }

    const { data: listData } = await supabase.auth.admin.listUsers()
    const existingUser = listData?.users.find((u) => u.email === email)
    if (existingUser) {
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: {
          ...existingUser.user_metadata,
          name,
          is_admin: true,
          admin_role: role,
        },
        app_metadata: {
          ...existingUser.app_metadata,
          is_admin: true,
          admin_role: role,
        },
      })
    }
  }

  const { error: tableError } = await supabase
    .from("admin_users")
    .upsert(
      {
        name,
        email,
        role,
        permissions: role === "master" ? [] : permissions,
        created_by_email: currentUser?.email ?? null,
      },
      { onConflict: "email" }
    )
    .select()
    .single()

  if (tableError) return { success: false, message: tableError.message }

  return {
    success: true,
    message:
      role === "master"
        ? "Administrador master cadastrado com sucesso!"
        : "Operador cadastrado com sucesso!",
  }
}

export async function updateAdminPermissions(
  adminId: string,
  permissions: AdminPermission[]
) {
  await verifyAdminAccess()

  const myInfo = await getMyAdminInfo()
  if (myInfo?.role !== "master") {
    return {
      success: false,
      message: "Apenas administradores master podem alterar permissões.",
    }
  }

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from("admin_users")
    .update({ permissions })
    .eq("id", adminId)
    .eq("role", "operator")

  if (error) return { success: false, message: error.message }
  return { success: true, message: "Permissões atualizadas com sucesso!" }
}

export async function deleteAdminUser(adminId: string) {
  await verifyAdminAccess()

  const myInfo = await getMyAdminInfo()
  if (myInfo?.role !== "master") {
    return {
      success: false,
      message: "Apenas administradores master podem remover admins.",
    }
  }

  const supabase = getServiceSupabase()

  const { data: adminData } = await supabase
    .from("admin_users")
    .select("email, role")
    .eq("id", adminId)
    .single()

  if (!adminData) return { success: false, message: "Administrador não encontrado." }
  if (adminData.role === "master") {
    return { success: false, message: "Não é possível remover um administrador master por aqui." }
  }

  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("id", adminId)

  if (error) return { success: false, message: error.message }

  const { data: listData } = await supabase.auth.admin.listUsers()
  const authUser = listData?.users.find((u) => u.email === adminData.email)
  if (authUser) {
    await supabase.auth.admin.updateUserById(authUser.id, {
      user_metadata: { ...authUser.user_metadata, is_admin: false, admin_role: null },
      app_metadata: { ...authUser.app_metadata, is_admin: false, admin_role: null },
    })
  }

  return { success: true, message: "Operador removido com sucesso." }
}

export async function resetAdminPassword(email: string) {
  await verifyAdminAccess()
  const supabase = getServiceSupabase()

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) return { success: false, message: "Erro ao buscar usuários" }

  const user = listData.users.find((u) => u.email === email)
  if (!user) return { success: false, message: "Usuário não encontrado no sistema de autenticação" }

  const isAdmin =
    user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
  if (!isAdmin) return { success: false, message: "Usuário não é administrador" }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/admin/recuperar-senha` },
  })

  if (linkError) return { success: false, message: linkError.message }

  const hashedToken = linkData?.properties?.hashed_token
  if (!hashedToken) return { success: false, message: "Erro ao gerar token de recuperação" }

  const resetLink = `${siteUrl}/admin/recuperar-senha?token_hash=${hashedToken}&type=recovery`

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
