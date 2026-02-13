"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminAccess, getCurrentUser } from "@/lib/auth"

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
  // Cria usuário na tabela admin_users
  const { data, error } = await supabase
    .from("admin_users")
    .insert({ name, email, password })
    .select()
    .single()
  if (error) return { success: false, message: error.message }
  return { success: true, message: "Administrador cadastrado com sucesso!" }
}
