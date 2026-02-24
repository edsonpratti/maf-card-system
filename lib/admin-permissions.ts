/**
 * Papéis e permissões do sistema de administração.
 * Este arquivo pode ser importado tanto por server components quanto client components.
 */

/** Papéis disponíveis para administradores */
export type AdminRole = 'master' | 'operator'

/**
 * Módulos do painel admin com suas chaves de permissão.
 * - Masters têm acesso irrestrito a todos os módulos.
 * - Operadores só acessam módulos explicitamente liberados pelo master.
 */
export const ADMIN_MODULES = [
  {
    key: 'maf-pro-id',
    label: 'MAF Pro ID',
    description: 'Solicitações, base de alunas e configurações do sistema de carteirinhas',
  },
  {
    key: 'maf-pro-quiz',
    label: 'MAF Pro Quiz',
    description: 'Criação e gestão de enquetes e questionários interativos',
  },
  {
    key: 'maf-pro-tasks',
    label: 'MAF Pro Tasks',
    description: 'Gerenciamento de tarefas internas da equipe',
  },
  {
    key: 'usuarios',
    label: 'Gestão de Usuários',
    description: 'Visualizar e gerenciar usuárias cadastradas no portal',
  },
  {
    key: 'logs',
    label: 'Logs de Auditoria',
    description: 'Histórico completo de ações administrativas',
  },
] as const

/** Chaves de permissão disponíveis para operadores */
export type AdminPermission = typeof ADMIN_MODULES[number]['key']

/**
 * Verifica se um usuário tem acesso a um módulo específico.
 * Masters sempre têm acesso. Operadores dependem da lista de permissões.
 */
export function hasPermission(
  role: AdminRole,
  permissions: AdminPermission[],
  module: AdminPermission
): boolean {
  if (role === 'master') return true
  return permissions.includes(module)
}

/** Labels amigáveis para exibição dos papéis */
export const ROLE_LABELS: Record<AdminRole, string> = {
  master: 'Master',
  operator: 'Operador',
}
