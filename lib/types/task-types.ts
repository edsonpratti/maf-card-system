// =============================================================================
// MAF Pro Tasks — Type Definitions
// Hierarquia: Projeto → Tarefa → Sub Tarefa
// =============================================================================

// ─── Admin Member (para dropdowns de gerente/responsável) ────────────────────
export interface AdminMember {
    id: string | number
    name: string
    email: string
    role: 'master' | 'operator'
}

// ─── Projeto ──────────────────────────────────────────────────────────────────
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface Project {
    id: string
    name: string
    description?: string | null
    manager_email: string
    status: ProjectStatus
    start_date: string
    end_date?: string | null
    created_by: string
    created_at: string
    updated_at: string
    // campos calculados (opcionais, retornados em algumas rotas)
    tasks_count?: number
    tasks_done?: number
}

export interface CreateProjectData {
    name: string
    description?: string
    manager_email: string
    status?: ProjectStatus
    start_date: string
    end_date?: string
}

export type UpdateProjectData = Partial<CreateProjectData>

// ─── Coluna Kanban (personalizável por projeto) ───────────────────────────────
export interface KanbanColumn {
    id: string
    project_id: string
    name: string
    position: number
    color?: string | null
    created_at: string
}

// ─── Estado computado de uma tarefa ──────────────────────────────────────────
// Derivado de done + due_datetime; não armazenado no banco
export type TaskState = 'active' | 'done' | 'overdue'

// ─── Tarefa ───────────────────────────────────────────────────────────────────
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
    id: string
    project_id: string
    title: string
    description?: string | null
    done: boolean              // única fonte de verdade sobre conclusão
    column_id?: string | null  // coluna kanban à qual pertence
    priority: TaskPriority
    assignee_email?: string | null
    due_datetime?: string | null   // ISO 8601 com hora
    created_by: string
    created_at: string
    updated_at: string
    // campos calculados
    subtasks_count?: number
    subtasks_done?: number
    // relações (presentes apenas no detalhe completo)
    subtasks?: Subtask[]
    comments?: TaskComment[]
    attachments?: TaskAttachment[]
}

export interface CreateTaskData {
    title: string
    description?: string
    priority?: TaskPriority
    assignee_email?: string
    due_datetime?: string
    column_id?: string
}

export interface UpdateTaskData {
    title?: string
    description?: string
    done?: boolean
    priority?: TaskPriority
    assignee_email?: string
    due_datetime?: string
    column_id?: string | null
}

// ─── Sub Tarefa ───────────────────────────────────────────────────────────────
export interface Subtask {
    id: string
    task_id: string
    title: string
    assignee_email?: string | null
    due_date?: string | null
    is_done: boolean
    created_by: string
    created_at: string
    updated_at: string
}

export interface CreateSubtaskData {
    title: string
    assignee_email?: string
    due_date?: string
}

export interface UpdateSubtaskData {
    title?: string
    assignee_email?: string
    due_date?: string
    is_done?: boolean
}

// ─── Comentário ──────────────────────────────────────────────────────────────
export interface TaskComment {
    id: string
    task_id: string
    content: string
    author_email: string
    created_at: string
    updated_at: string
}

// ─── Anexo ───────────────────────────────────────────────────────────────────
export interface TaskAttachment {
    id: string
    task_id: string
    file_name: string
    file_path: string
    file_size?: number | null
    mime_type?: string | null
    uploaded_by: string
    created_at: string
    // URL assinada gerada pelo servidor (válida por 1h)
    signed_url?: string
}

// ─── Labels ──────────────────────────────────────────────────────────────────
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    active:    'Ativo',
    paused:    'Pausado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
}

export const TASK_STATE_LABELS: Record<TaskState, string> = {
    active:  'Ativa',
    done:    'Concluída',
    overdue: 'Em atraso',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
    low:    'Baixa',
    medium: 'Média',
    high:   'Alta',
    urgent: 'Urgente',
}

// ─── Badge variants ───────────────────────────────────────────────────────────
export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, 'success' | 'warning' | 'secondary' | 'destructive'> = {
    active:    'success',
    paused:    'warning',
    completed: 'secondary',
    cancelled: 'destructive',
}

export const TASK_STATE_VARIANT: Record<TaskState, 'secondary' | 'success' | 'destructive'> = {
    active:  'secondary',
    done:    'success',
    overdue: 'destructive',
}

export const TASK_PRIORITY_VARIANT: Record<TaskPriority, 'outline' | 'secondary' | 'warning' | 'destructive'> = {
    low:    'outline',
    medium: 'secondary',
    high:   'warning',
    urgent: 'destructive',
}
