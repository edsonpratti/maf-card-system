'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Trash2,
    Plus,
    Send,
    Paperclip,
    Download,
    X,
    User,
    CalendarDays,
    AlertCircle,
    Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Task,
    TaskPriority,
    KanbanColumn,
    Subtask,
    TaskComment,
    TaskAttachment,
    AdminMember,
    TASK_STATE_LABELS,
    TASK_PRIORITY_LABELS,
    TASK_STATE_VARIANT,
    TASK_PRIORITY_VARIANT,
    CreateSubtaskData,
    UpdateTaskData,
} from '@/lib/types/task-types'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDatetime(d: string | null | undefined) {
    if (!d) return '—'
    const parsed = parseISO(d)
    return format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR })
}

function DueDateBadge({ dt }: { dt: string | null | undefined }) {
    if (!dt) return <span className="text-muted-foreground">—</span>
    const parsed  = parseISO(dt)
    const overdue = isPast(parsed) && !isToday(parsed)
    const today   = isToday(parsed)
    return (
        <span className={`flex items-center gap-1 text-sm font-medium ${overdue ? 'text-destructive' : today ? 'text-yellow-600' : ''}`}>
            {(overdue || today) && <AlertCircle className="h-3.5 w-3.5" />}
            {fmtDatetime(dt)}
        </span>
    )
}

function formatBytes(bytes: number | null | undefined) {
    if (!bytes) return ''
    if (bytes < 1024)       return `${bytes} B`
    if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

function getTaskState(task: Pick<Task, 'done' | 'due_datetime'>) {
    if (task.done) return 'done' as const
    if (task.due_datetime) {
        const parsed = parseISO(task.due_datetime)
        if (isPast(parsed) && !isToday(parsed)) return 'overdue' as const
    }
    return 'active' as const
}

// ─── Aba: Sub Tarefas ─────────────────────────────────────────────────────────
interface SubtasksTabProps {
    taskId:  string
    members: AdminMember[]
    isOwner: boolean
}

function SubtasksTab({ taskId, members, isOwner }: SubtasksTabProps) {
    const [subtasks, setSubtasks] = useState<Subtask[]>([])
    const [loading,  setLoading]  = useState(true)
    const [adding,   setAdding]   = useState(false)
    const [form,     setForm]     = useState<CreateSubtaskData & { assignee_email: string; due_date: string }>({
        title: '', assignee_email: '', due_date: '',
    })

    const load = async () => {
        setLoading(true)
        const res = await fetch(`/api/admin/tasks/${taskId}/subtasks`)
        if (res.ok) setSubtasks(await res.json())
        setLoading(false)
    }

    useEffect(() => { load() }, [taskId]) // eslint-disable-line react-hooks/exhaustive-deps

    const toggleDone = async (subtask: Subtask) => {
        const res = await fetch(`/api/admin/tasks/${taskId}/subtasks/${subtask.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_done: !subtask.is_done }),
        })
        if (res.ok) load()
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim()) return
        const res = await fetch(`/api/admin/tasks/${taskId}/subtasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title:          form.title.trim(),
                assignee_email: form.assignee_email || undefined,
                due_date:       form.due_date || undefined,
            }),
        })
        if (res.ok) {
            toast.success('Sub tarefa criada')
            setForm({ title: '', assignee_email: '', due_date: '' })
            setAdding(false)
            load()
        } else {
            toast.error('Erro ao criar sub tarefa')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta sub tarefa?')) return
        const res = await fetch(`/api/admin/tasks/${taskId}/subtasks/${id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Sub tarefa excluída'); load() }
        else toast.error('Erro ao excluir sub tarefa')
    }

    const done  = subtasks.filter(s => s.is_done).length
    const total = subtasks.length

    return (
        <div className="space-y-3">
            {/* Progresso */}
            {total > 0 && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{done}/{total} concluídas</span>
                        <span>{total === 0 ? 0 : Math.round((done / total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
            ) : subtasks.length === 0 && !adding ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma sub tarefa. Crie a primeira abaixo.</p>
            ) : (
                <ul className="space-y-2">
                    {subtasks.map(s => (
                        <li key={s.id} className="flex items-start gap-2 group rounded-lg border p-2.5">
                            <Checkbox
                                id={s.id}
                                checked={s.is_done}
                                onCheckedChange={() => isOwner && toggleDone(s)}
                                disabled={!isOwner}
                                className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                                <label
                                    htmlFor={s.id}
                                    className={`text-sm cursor-pointer leading-snug ${s.is_done ? 'line-through text-muted-foreground' : ''}`}
                                >
                                    {s.title}
                                </label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {s.assignee_email && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <User className="h-3 w-3" />{s.assignee_email}
                                        </span>
                                    )}
                                    {s.due_date && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <CalendarDays className="h-3 w-3" />{fmtDate(s.due_date)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isOwner && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={() => handleDelete(s.id)}
                                >
                                    <X className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* Formulário de adição */}
            {adding ? (
                <form onSubmit={handleAdd} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <Input
                        autoFocus
                        placeholder="Título da sub tarefa *"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        required
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Select
                            value={form.assignee_email || '__none__'}
                            onValueChange={v => setForm(f => ({ ...f, assignee_email: v === '__none__' ? '' : v }))}
                        >
                            <SelectTrigger className="text-xs h-8">
                                <SelectValue placeholder="Responsável" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Sem responsável</SelectItem>
                                {members.map(m => (
                                    <SelectItem key={m.email} value={m.email}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            className="h-8 text-xs"
                            value={form.due_date}
                            onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1">Adicionar</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setAdding(false)}>Cancelar</Button>
                    </div>
                </form>
            ) : (
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setAdding(true)}>
                    <Plus className="h-3.5 w-3.5" />Nova Sub Tarefa
                </Button>
            )}
        </div>
    )
}

// ─── Aba: Comentários ─────────────────────────────────────────────────────────
interface CommentsTabProps {
    taskId: string
}

function CommentsTab({ taskId }: CommentsTabProps) {
    const [comments, setComments] = useState<TaskComment[]>([])
    const [loading,  setLoading]  = useState(true)
    const [content,  setContent]  = useState('')
    const [sending,  setSending]  = useState(false)
    const endRef = useRef<HTMLDivElement>(null)

    const load = async () => {
        setLoading(true)
        const res = await fetch(`/api/admin/tasks/${taskId}/comments`)
        if (res.ok) setComments(await res.json())
        setLoading(false)
    }

    useEffect(() => { load() }, [taskId]) // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return
        setSending(true)
        const res = await fetch(`/api/admin/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content.trim() }),
        })
        if (res.ok) { setContent(''); load() }
        else toast.error('Erro ao enviar comentário')
        setSending(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este comentário?')) return
        const res = await fetch(`/api/admin/tasks/${taskId}/comments/${id}`, { method: 'DELETE' })
        if (res.ok) load()
        else toast.error('Erro ao excluir comentário')
    }

    return (
        <div className="flex flex-col h-full space-y-3">
            <div className="flex-1 space-y-3 max-h-80 overflow-y-auto pr-1">
                {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
                ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda.</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="group rounded-lg border p-3 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <span className="text-xs font-medium">{c.author_email}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                        {format(parseISO(c.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDelete(c.id)}
                                >
                                    <X className="h-3 w-3 text-destructive" />
                                </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                        </div>
                    ))
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
                <Textarea
                    placeholder="Escreva um comentário..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={2}
                    className="flex-1 resize-none"
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend(e)
                        }
                    }}
                />
                <Button type="submit" size="icon" disabled={sending || !content.trim()} className="self-end">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
            <p className="text-xs text-muted-foreground">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
    )
}

// ─── Aba: Anexos ──────────────────────────────────────────────────────────────
interface AttachmentsTabProps {
    taskId:  string
    isOwner: boolean
}

function AttachmentsTab({ taskId, isOwner }: AttachmentsTabProps) {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([])
    const [loading,     setLoading]     = useState(true)
    const [uploading,   setUploading]   = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const load = async () => {
        setLoading(true)
        const res = await fetch(`/api/admin/tasks/${taskId}/attachments`)
        if (res.ok) setAttachments(await res.json())
        setLoading(false)
    }

    useEffect(() => { load() }, [taskId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`/api/admin/tasks/${taskId}/attachments`, { method: 'POST', body: fd })
        if (res.ok) { toast.success('Arquivo enviado'); load() }
        else {
            const body = await res.json()
            toast.error(body.error ?? 'Erro no upload')
        }
        setUploading(false)
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Excluir o arquivo "${name}"?`)) return
        const res = await fetch(`/api/admin/tasks/${taskId}/attachments/${id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Arquivo removido'); load() }
        else toast.error('Erro ao remover arquivo')
    }

    return (
        <div className="space-y-3">
            {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
            ) : attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum arquivo anexado.</p>
            ) : (
                <ul className="space-y-2">
                    {attachments.map(att => (
                        <li key={att.id} className="group flex items-center gap-2 border rounded-lg p-2.5">
                            <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{att.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatBytes(att.file_size)} · {att.uploaded_by}
                                </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                {att.signed_url && (
                                    <a href={att.signed_url} target="_blank" rel="noopener noreferrer" download={att.file_name}>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                    </a>
                                )}
                                {isOwner && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(att.id, att.file_name)}
                                    >
                                        <X className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div>
                <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                />
                {isOwner && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            disabled={uploading}
                            onClick={() => fileRef.current?.click()}
                        >
                            <Paperclip className="h-3.5 w-3.5" />
                            {uploading ? 'Enviando...' : 'Anexar arquivo'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1 text-center">Máx. 50 MB · PDF, Word, Excel, imagens, ZIP</p>
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Diálogo de edição da tarefa ──────────────────────────────────────────────
interface EditTaskDialogProps {
    open:     boolean
    task:     Task
    members:  AdminMember[]
    columns:  KanbanColumn[]
    onClose:  () => void
    onSaved:  (t: Task) => void
}

function EditTaskDialog({ open, task, members, columns, onClose, onSaved }: EditTaskDialogProps) {
    const [form, setForm] = useState({
        title:          task.title,
        description:    task.description ?? '',
        priority:       task.priority,
        assignee_email: task.assignee_email ?? '',
        due_datetime:   task.due_datetime ? task.due_datetime.slice(0, 16) : '',
        column_id:      task.column_id ?? '',
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setForm({
            title:          task.title,
            description:    task.description ?? '',
            priority:       task.priority,
            assignee_email: task.assignee_email ?? '',
            due_datetime:   task.due_datetime ? task.due_datetime.slice(0, 16) : '',
            column_id:      task.column_id ?? '',
        })
    }, [task])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const payload: UpdateTaskData = {
            title:          form.title.trim(),
            description:    form.description.trim() || undefined,
            priority:       form.priority,
            assignee_email: form.assignee_email || undefined,
            due_datetime:   form.due_datetime ? new Date(form.due_datetime).toISOString() : undefined,
            column_id:      form.column_id || null,
        }
        const res = await fetch(`/api/admin/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        if (res.ok) {
            const updated = await res.json()
            toast.success('Tarefa atualizada')
            onSaved(updated)
            onClose()
        } else {
            toast.error('Erro ao atualizar tarefa')
        }
        setSaving(false)
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Tarefa</DialogTitle>
                    <DialogDescription className="sr-only">Edite os dados da tarefa.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Título *</Label>
                        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Descrição</Label>
                        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Prioridade</Label>
                            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as TaskPriority }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(Object.entries(TASK_PRIORITY_LABELS) as [TaskPriority, string][]).map(([v, l]) => (
                                        <SelectItem key={v} value={v}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Coluna Kanban</Label>
                            <Select
                                value={form.column_id || '__none__'}
                                onValueChange={v => setForm(f => ({ ...f, column_id: v === '__none__' ? '' : v }))}
                            >
                                <SelectTrigger><SelectValue placeholder="Sem coluna" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sem coluna</SelectItem>
                                    {columns.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Responsável</Label>
                            <Select
                                value={form.assignee_email || '__none__'}
                                onValueChange={v => setForm(f => ({ ...f, assignee_email: v === '__none__' ? '' : v }))}
                            >
                                <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sem responsável</SelectItem>
                                    {members.map(m => (
                                        <SelectItem key={m.email} value={m.email}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Prazo</Label>
                            <Input
                                type="datetime-local"
                                value={form.due_datetime}
                                onChange={e => setForm(f => ({ ...f, due_datetime: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Sheet Principal ──────────────────────────────────────────────────────────
interface TaskDetailSheetProps {
    task:               Task | null
    members:            AdminMember[]
    columns:            KanbanColumn[]
    open:               boolean
    currentAdminEmail:  string
    onClose:            () => void
    onUpdated:          (t: Task) => void
    onDeleted:          (id: string) => void
}

export function TaskDetailSheet({ task, members, columns, open, currentAdminEmail, onClose, onUpdated, onDeleted }: TaskDetailSheetProps) {
    const [editOpen, setEditOpen] = useState(false)

    if (!task) return null

    // Apenas o responsável (ou tarefas sem responsável) pode editar/excluir
    const isOwner = !task.assignee_email || task.assignee_email === currentAdminEmail

    const handleDelete = async () => {
        if (!confirm(`Excluir a tarefa "${task.title}"? Esta ação não pode ser desfeita.`)) return
        const res = await fetch(`/api/admin/tasks/${task.id}`, { method: 'DELETE' })
        if (res.ok) {
            toast.success('Tarefa excluída')
            onDeleted(task.id)
            onClose()
        } else {
            toast.error('Erro ao excluir tarefa')
        }
    }

    return (
        <>
            <Sheet open={open} onOpenChange={v => !v && onClose()}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
                    {/* Header */}
                    <SheetHeader className="p-6 pb-4 border-b">
                        <SheetDescription className="sr-only">Detalhes da tarefa: sub tarefas, comentários e anexos.</SheetDescription>
                        <div className="flex items-start justify-between gap-3">
                            <SheetTitle className="text-base leading-snug text-left flex-1">
                                {task.title}
                            </SheetTitle>
                            <div className="flex gap-1 shrink-0">
                                {isOwner && (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant={TASK_STATE_VARIANT[getTaskState(task)]}>
                                {TASK_STATE_LABELS[getTaskState(task)]}
                            </Badge>
                            <Badge variant={TASK_PRIORITY_VARIANT[task.priority]}>
                                {TASK_PRIORITY_LABELS[task.priority]}
                            </Badge>
                        </div>
                    </SheetHeader>

                    {/* Info */}
                    <div className="px-6 py-4 border-b space-y-3">
                        {task.description && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Responsável</p>
                                <p className="font-medium flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    {task.assignee_email ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Prazo</p>
                                <DueDateBadge dt={task.due_datetime} />
                            </div>
                        </div>
                    </div>

                    {/* Abas */}
                    <div className="flex-1 px-6 py-4">
                        <Tabs defaultValue="subtasks">
                            <TabsList className="w-full mb-4">
                                <TabsTrigger value="subtasks"  className="flex-1">Sub Tarefas</TabsTrigger>
                                <TabsTrigger value="comments"  className="flex-1">Comentários</TabsTrigger>
                                <TabsTrigger value="attachments" className="flex-1">Anexos</TabsTrigger>
                            </TabsList>

                            <TabsContent value="subtasks">
                                <SubtasksTab taskId={task.id} members={members} isOwner={isOwner} />
                            </TabsContent>

                            <TabsContent value="comments">
                                <CommentsTab taskId={task.id} />
                            </TabsContent>

                            <TabsContent value="attachments">
                                <AttachmentsTab taskId={task.id} isOwner={isOwner} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </SheetContent>
            </Sheet>

            {editOpen && (
                <EditTaskDialog
                    open={editOpen}
                    task={task}
                    members={members}
                    columns={columns}
                    onClose={() => setEditOpen(false)}
                    onSaved={(t) => { onUpdated(t); setEditOpen(false) }}
                />
            )}
        </>
    )
}
