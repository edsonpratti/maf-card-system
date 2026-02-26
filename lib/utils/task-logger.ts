import { getServiceSupabase } from '@/lib/supabase'

const PRIORITY_PT: Record<string, string> = {
    low:    'Baixa',
    medium: 'Média',
    high:   'Alta',
    urgent: 'Urgente',
}

/** Formata ISO datetime como string legível em pt-BR, sem depender de date-fns no server */
function fmtDt(iso: string | null | undefined): string {
    if (!iso) return '—'
    const d = new Date(iso)
    return (
        d.toLocaleDateString('pt-BR') +
        ' às ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    )
}

export { PRIORITY_PT, fmtDt }

/**
 * Escreve um evento de log para uma tarefa.
 * Fire-and-forget: nunca bloqueia a operação principal em caso de falha.
 */
export async function logTaskEvent(
    taskId:      string,
    actorEmail:  string,
    action:      string,
    detail?:     string | null
): Promise<void> {
    try {
        const supabase = getServiceSupabase()
        await supabase.from('tasks_logs').insert({
            task_id:     taskId,
            actor_email: actorEmail,
            action,
            detail: detail ?? null,
        })
    } catch {
        console.error('[task-logger] Falha ao registrar log da tarefa')
    }
}

/**
 * Compara dois valores de campo e gera log(s) para as diferenças encontradas.
 * Retorna um array de { action, detail } prontos para inserção.
 */
export function diffTaskFields(
    existing: Record<string, unknown>,
    updates:  Record<string, unknown>
): { action: string; detail: string }[] {
    const entries: { action: string; detail: string }[] = []

    if ('title' in updates && updates.title !== existing.title) {
        entries.push({
            action: 'title_changed',
            detail: `Título alterado: "${existing.title}" → "${updates.title}"`,
        })
    }

    if ('description' in updates) {
        const oldDesc = existing.description ?? null
        const newDesc = (updates.description as string | null) ?? null
        if (oldDesc !== newDesc) {
            if (!oldDesc && newDesc)       entries.push({ action: 'description_changed', detail: 'Descrição adicionada' })
            else if (oldDesc && !newDesc)  entries.push({ action: 'description_changed', detail: 'Descrição removida' })
            else                           entries.push({ action: 'description_changed', detail: 'Descrição atualizada' })
        }
    }

    if ('done' in updates && updates.done !== existing.done) {
        entries.push({
            action: updates.done ? 'done' : 'undone',
            detail: updates.done ? 'Tarefa marcada como concluída' : 'Tarefa reaberta',
        })
    }

    if ('priority' in updates && updates.priority !== existing.priority) {
        const oldP = PRIORITY_PT[existing.priority as string] ?? existing.priority
        const newP = PRIORITY_PT[updates.priority as string]  ?? updates.priority
        entries.push({
            action: 'priority_changed',
            detail: `Prioridade alterada: ${oldP} → ${newP}`,
        })
    }

    if ('assignee_email' in updates) {
        const oldA = (existing.assignee_email as string | null) ?? null
        const newA = (updates.assignee_email  as string | null) ?? null
        if (oldA !== newA) {
            if (!oldA && newA)       entries.push({ action: 'assignee_changed', detail: `Responsável definido: ${newA}` })
            else if (oldA && !newA)  entries.push({ action: 'assignee_changed', detail: `Responsável removido (era: ${oldA})` })
            else                     entries.push({ action: 'assignee_changed', detail: `Responsável alterado: ${oldA} → ${newA}` })
        }
    }

    if ('due_datetime' in updates) {
        const oldD = (existing.due_datetime as string | null) ?? null
        const newD = (updates.due_datetime  as string | null) ?? null
        if (oldD !== newD) {
            if (!oldD && newD)       entries.push({ action: 'due_changed', detail: `Prazo definido: ${fmtDt(newD)}` })
            else if (oldD && !newD)  entries.push({ action: 'due_changed', detail: `Prazo removido (era: ${fmtDt(oldD)})` })
            else                     entries.push({ action: 'due_changed', detail: `Prazo alterado: ${fmtDt(oldD)} → ${fmtDt(newD)}` })
        }
    }

    if ('column_id' in updates) {
        const oldC = (existing.column_id as string | null) ?? null
        const newC = (updates.column_id  as string | null) ?? null
        if (oldC !== newC) {
            entries.push({ action: 'column_changed', detail: 'Coluna Kanban alterada' })
        }
    }

    return entries
}
