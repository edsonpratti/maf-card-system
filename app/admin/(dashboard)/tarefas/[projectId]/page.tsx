'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Plus,
    ArrowLeft,
    User,
    CalendarDays,
    AlertCircle,
    CheckCircle2,
    Circle,
    ListTodo,
    FolderKanban,
    LayoutGrid,
    List,
    Columns3,
    SlidersHorizontal,
    MoreVertical,
    Pencil,
    Trash2,
    GripVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Project,
    Task,
    TaskState,
    TaskPriority,
    KanbanColumn,
    CreateTaskData,
    AdminMember,
    TASK_STATE_LABELS,
    TASK_PRIORITY_LABELS,
    TASK_STATE_VARIANT,
    TASK_PRIORITY_VARIANT,
    PROJECT_STATUS_LABELS,
    PROJECT_STATUS_VARIANT,
} from '@/lib/types/task-types'
import { TaskDetailSheet } from '@/components/admin/tasks/task-detail-sheet'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ViewMode   = 'cards' | 'list' | 'kanban'
type TabFilter  = TaskState | 'all'
type ListCol    = 'state' | 'priority' | 'assignee' | 'due' | 'subtasks' | 'column'

const ALL_LIST_COLS: { key: ListCol; label: string }[] = [
    { key: 'state',    label: 'Estado' },
    { key: 'priority', label: 'Prioridade' },
    { key: 'assignee', label: 'Responsável' },
    { key: 'due',      label: 'Prazo' },
    { key: 'subtasks', label: 'Sub tarefas' },
    { key: 'column',   label: 'Coluna Kanban' },
]

const DEFAULT_LIST_COLS = new Set<ListCol>(['state', 'priority', 'assignee', 'due', 'subtasks'])

const COLUMN_COLORS: { label: string; value: string; border: string }[] = [
    { label: 'Cinza',    value: 'slate',  border: 'border-t-slate-400' },
    { label: 'Azul',     value: 'blue',   border: 'border-t-blue-400' },
    { label: 'Verde',    value: 'green',  border: 'border-t-green-500' },
    { label: 'Amarelo',  value: 'yellow', border: 'border-t-yellow-400' },
    { label: 'Laranja',  value: 'orange', border: 'border-t-orange-400' },
    { label: 'Vermelho', value: 'red',    border: 'border-t-red-400' },
    { label: 'Roxo',     value: 'purple', border: 'border-t-purple-400' },
    { label: 'Rosa',     value: 'pink',   border: 'border-t-pink-400' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTaskState(task: Pick<Task, 'done' | 'due_datetime'>): TaskState {
    if (task.done) return 'done'
    if (task.due_datetime) {
        const parsed = parseISO(task.due_datetime)
        if (isPast(parsed) && !isToday(parsed)) return 'overdue'
    }
    return 'active'
}

function getColBorder(color: string | null | undefined) {
    return COLUMN_COLORS.find(c => c.value === color)?.border ?? 'border-t-slate-400'
}

function DueMeta({ dt }: { dt: string | null | undefined }) {
    if (!dt) return null
    const parsed  = parseISO(dt)
    const overdue = isPast(parsed) && !isToday(parsed)
    const today   = isToday(parsed)
    return (
        <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-destructive font-medium' : today ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
            {(overdue || today) && <AlertCircle className="h-3 w-3" />}
            <CalendarDays className="h-3 w-3" />
            {format(parsed, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </span>
    )
}

function StateBadge({ task }: { task: Task }) {
    const state = getTaskState(task)
    return <Badge variant={TASK_STATE_VARIANT[state]} className="text-xs">{TASK_STATE_LABELS[state]}</Badge>
}

function CompleteBtn({ task, onComplete, size = 'md', disabled = false }: {
    task: Task; onComplete: (t: Task) => void; size?: 'sm' | 'md'; disabled?: boolean
}) {
    return (
        <button
            onClick={e => { e.stopPropagation(); onComplete(task) }}
            disabled={disabled}
            className={`shrink-0 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${task.done ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground/30 hover:text-green-500'}`}
            title={disabled ? 'Apenas o responsável pode alterar' : task.done ? 'Marcar como pendente' : 'Marcar como concluído'}
        >
            <CheckCircle2 className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
        </button>
    )
}

// ─── Diálogo: Nova Tarefa ─────────────────────────────────────────────────────
const EMPTY_TASK = {
    title: '', description: '',
    priority: 'medium' as TaskPriority,
    assignee_email: '', due_datetime: '', column_id: '',
}

function TaskDialog({ open, members, columns, onClose, onSave, saving }: {
    open: boolean; members: AdminMember[]; columns: KanbanColumn[]
    onClose: () => void; onSave: (d: CreateTaskData) => Promise<void>; saving: boolean
}) {
    const [form, setForm] = useState(EMPTY_TASK)
    useEffect(() => { if (!open) setForm(EMPTY_TASK) }, [open])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim()) { toast.error('Título obrigatório'); return }
        await onSave({
            title:          form.title.trim(),
            description:    form.description.trim() || undefined,
            priority:       form.priority,
            assignee_email: form.assignee_email || undefined,
            due_datetime:   form.due_datetime ? new Date(form.due_datetime).toISOString() : undefined,
            column_id:      form.column_id || undefined,
        })
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nova Tarefa</DialogTitle>
                    <DialogDescription className="sr-only">Preencha os dados para criar uma nova tarefa.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Título *</Label>
                        <Input placeholder="Título da tarefa" value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Descrição</Label>
                        <Textarea placeholder="Descrição detalhada..." rows={3} value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Prioridade</Label>
                            <Select value={form.priority}
                                onValueChange={v => setForm(f => ({ ...f, priority: v as TaskPriority }))}>
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
                            <Select value={form.column_id || '__none__'}
                                onValueChange={v => setForm(f => ({ ...f, column_id: v === '__none__' ? '' : v }))}>
                                <SelectTrigger><SelectValue placeholder="Sem coluna" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sem coluna</SelectItem>
                                    {columns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Responsável</Label>
                            <Select value={form.assignee_email || '__none__'}
                                onValueChange={v => setForm(f => ({ ...f, assignee_email: v === '__none__' ? '' : v }))}>
                                <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sem responsável</SelectItem>
                                    {members.map(m => <SelectItem key={m.email} value={m.email}>{m.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Prazo</Label>
                            <Input type="datetime-local" value={form.due_datetime}
                                onChange={e => setForm(f => ({ ...f, due_datetime: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Criando...' : 'Criar tarefa'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Diálogo: Nova / Renomear Coluna ─────────────────────────────────────────
function ColumnDialog({ open, initial, onClose, onSave }: {
    open: boolean; initial?: KanbanColumn | null
    onClose: () => void; onSave: (name: string, color: string) => Promise<void>
}) {
    const [name,   setName]   = useState('')
    const [color,  setColor]  = useState('slate')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) { setName(initial?.name ?? ''); setColor(initial?.color ?? 'slate') }
    }, [open, initial])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        setSaving(true)
        await onSave(name.trim(), color)
        setSaving(false)
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Renomear coluna' : 'Nova coluna'}</DialogTitle>
                    <DialogDescription className="sr-only">Configure a coluna kanban.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Nome *</Label>
                        <Input autoFocus placeholder="Ex: Em Andamento, Revisão..." value={name}
                            onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Cor da coluna</Label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {COLUMN_COLORS.map(c => (
                                <button key={c.value} type="button" onClick={() => setColor(c.value)} title={c.label}
                                    className={`w-7 h-7 rounded-full border-2 transition-all
                                        ${color === c.value ? 'scale-125 border-foreground shadow' : 'border-transparent opacity-70 hover:opacity-100'}
                                        ${c.value === 'slate'  ? 'bg-slate-400'  : ''}
                                        ${c.value === 'blue'   ? 'bg-blue-400'   : ''}
                                        ${c.value === 'green'  ? 'bg-green-500'  : ''}
                                        ${c.value === 'yellow' ? 'bg-yellow-400' : ''}
                                        ${c.value === 'orange' ? 'bg-orange-400' : ''}
                                        ${c.value === 'red'    ? 'bg-red-400'    : ''}
                                        ${c.value === 'purple' ? 'bg-purple-400' : ''}
                                        ${c.value === 'pink'   ? 'bg-pink-400'   : ''}
                                    `}
                                />
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button type="submit" disabled={saving || !name.trim()}>
                            {saving ? 'Salvando...' : (initial ? 'Renomear' : 'Criar')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Visão: Cards ─────────────────────────────────────────────────────────────
function CardsView({ tasks, onOpen, onComplete, currentAdminEmail }: {
    tasks: Task[]; onOpen: (t: Task) => void; onComplete: (t: Task) => void; currentAdminEmail: string
}) {
    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map(task => (
                <Card key={task.id}
                    className="group cursor-pointer hover:shadow-sm hover:border-primary/40 transition-all duration-150"
                    onClick={() => onOpen(task)}>
                    <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5"><CompleteBtn task={task} onComplete={onComplete} disabled={!!task.assignee_email && task.assignee_email !== currentAdminEmail} /></div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium leading-snug ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                </p>
                                {task.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <StateBadge task={task} />
                                    <Badge variant={TASK_PRIORITY_VARIANT[task.priority]} className="text-xs">
                                        {TASK_PRIORITY_LABELS[task.priority]}
                                    </Badge>
                                    {task.assignee_email && (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <User className="h-3 w-3" />{task.assignee_email}
                                        </span>
                                    )}
                                    <DueMeta dt={task.due_datetime} />
                                    {(task.subtasks_count ?? 0) > 0 && (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <ListTodo className="h-3 w-3" />{task.subtasks_done}/{task.subtasks_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// ─── Visão: Lista ─────────────────────────────────────────────────────────────
function ListView({ tasks, visibleCols, columns, onOpen, onComplete, currentAdminEmail }: {
    tasks: Task[]; visibleCols: Set<ListCol>; columns: KanbanColumn[]
    onOpen: (t: Task) => void; onComplete: (t: Task) => void
    currentAdminEmail: string
}) {
    const colName = (id: string | null | undefined) => columns.find(c => c.id === id)?.name ?? '—'
    return (
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/50">
                        <th className="w-8 p-3" />
                        <th className="text-left p-3 font-medium">Título</th>
                        {visibleCols.has('state')    && <th className="text-left p-3 font-medium">Estado</th>}
                        {visibleCols.has('priority') && <th className="text-left p-3 font-medium">Prioridade</th>}
                        {visibleCols.has('assignee') && <th className="text-left p-3 font-medium">Responsável</th>}
                        {visibleCols.has('due')      && <th className="text-left p-3 font-medium">Prazo</th>}
                        {visibleCols.has('subtasks') && <th className="text-left p-3 font-medium">Sub tarefas</th>}
                        {visibleCols.has('column')   && <th className="text-left p-3 font-medium">Coluna</th>}
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task, i) => (
                        <tr key={task.id}
                            className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}
                            onClick={() => onOpen(task)}>
                            <td className="p-3" onClick={e => e.stopPropagation()}>
                                <CompleteBtn task={task} onComplete={onComplete} size="sm" disabled={!!task.assignee_email && task.assignee_email !== currentAdminEmail} />
                            </td>
                            <td className="p-3 max-w-xs">
                                <span className={`font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                </span>
                                {task.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                            </td>
                            {visibleCols.has('state')    && <td className="p-3 whitespace-nowrap"><StateBadge task={task} /></td>}
                            {visibleCols.has('priority') && (
                                <td className="p-3 whitespace-nowrap">
                                    <Badge variant={TASK_PRIORITY_VARIANT[task.priority]} className="text-xs">
                                        {TASK_PRIORITY_LABELS[task.priority]}
                                    </Badge>
                                </td>
                            )}
                            {visibleCols.has('assignee') && (
                                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {task.assignee_email
                                        ? <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignee_email}</span>
                                        : '—'}
                                </td>
                            )}
                            {visibleCols.has('due')      && <td className="p-3 whitespace-nowrap"><DueMeta dt={task.due_datetime} /></td>}
                            {visibleCols.has('subtasks') && (
                                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {(task.subtasks_count ?? 0) > 0
                                        ? <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" />{task.subtasks_done}/{task.subtasks_count}</span>
                                        : '—'}
                                </td>
                            )}
                            {visibleCols.has('column') && (
                                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {colName(task.column_id)}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// ─── Visão: Kanban ────────────────────────────────────────────────────────────
function KanbanCard({ task, columns, currentColId, onOpen, onComplete, onMove, currentAdminEmail }: {
    task: Task; columns: KanbanColumn[]; currentColId: string | null
    onOpen: (t: Task) => void; onComplete: (t: Task) => void
    onMove: (t: Task, colId: string | null) => void; currentAdminEmail: string
}) {
    const isOwner = !task.assignee_email || task.assignee_email === currentAdminEmail
    const destinations = currentColId
        ? ([{ id: null, name: 'Sem coluna' }, ...columns.filter(c => c.id !== currentColId)] as { id: string | null; name: string }[])
        : (columns.map(c => ({ id: c.id as string | null, name: c.name })))

    return (
        <Card className="group cursor-pointer hover:shadow-sm hover:border-primary/40 transition-all duration-150"
            onClick={() => onOpen(task)}>
            <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                    <div className="mt-0.5" onClick={e => e.stopPropagation()}>
                        <CompleteBtn task={task} onComplete={onComplete} size="sm" disabled={!isOwner} />
                    </div>
                    <p className={`text-sm font-medium leading-snug flex-1 min-w-0 ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                    </p>
                    {destinations.length > 0 && isOwner && (
                        <div onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                        <GripVertical className="h-3.5 w-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel className="text-xs">Mover para</DropdownMenuLabel>
                                    {destinations.map(col => (
                                        <DropdownMenuItem key={col.id ?? '__none__'} onClick={() => onMove(task, col.id)}>
                                            {col.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <StateBadge task={task} />
                    <Badge variant={TASK_PRIORITY_VARIANT[task.priority]} className="text-xs">
                        {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                    {task.assignee_email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[100px]">{task.assignee_email.split('@')[0]}</span>
                        </span>
                    )}
                    {(task.subtasks_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ListTodo className="h-3 w-3" />{task.subtasks_done}/{task.subtasks_count}
                        </span>
                    )}
                </div>
                {task.due_datetime && <DueMeta dt={task.due_datetime} />}
            </CardContent>
        </Card>
    )
}

function KanbanView({ tasks, columns, onOpen, onComplete, onMove, onAddCol, onRename, onDelete, currentAdminEmail }: {
    tasks: Task[]; columns: KanbanColumn[]
    onOpen:     (t: Task) => void
    onComplete: (t: Task) => void
    onMove:     (t: Task, colId: string | null) => void
    onAddCol:   () => void
    onRename:   (col: KanbanColumn) => void
    onDelete:   (col: KanbanColumn) => void
    currentAdminEmail: string
}) {
    const unassigned = tasks.filter(t => !t.column_id || !columns.find(c => c.id === t.column_id))

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 items-start">
            {/* Sem coluna */}
            {unassigned.length > 0 && (
                <div className="flex-shrink-0 w-72 rounded-lg border border-t-4 border-t-muted-foreground/30 bg-muted/20">
                    <div className="p-3 border-b bg-background/50 flex items-center justify-between">
                        <span className="font-medium text-sm text-muted-foreground">Sem coluna</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">{unassigned.length}</span>
                    </div>
                    <div className="p-2 space-y-2 min-h-16">
                        {unassigned.map(task => (
                            <KanbanCard key={task.id} task={task} columns={columns} currentColId={null}
                                onOpen={onOpen} onComplete={onComplete} onMove={onMove} currentAdminEmail={currentAdminEmail} />
                        ))}
                    </div>
                </div>
            )}

            {/* Colunas personalizadas */}
            {columns.map(col => {
                const colTasks = tasks.filter(t => t.column_id === col.id)
                return (
                    <div key={col.id} className={`flex-shrink-0 w-72 rounded-lg border border-t-4 bg-muted/20 ${getColBorder(col.color)}`}>
                        <div className="p-3 border-b bg-background/50 flex items-center justify-between">
                            <span className="font-medium text-sm truncate flex-1">{col.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">{colTasks.length}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onRename(col)}>
                                            <Pencil className="h-3.5 w-3.5 mr-2" />Renomear
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onDelete(col)} className="text-destructive focus:text-destructive">
                                            <Trash2 className="h-3.5 w-3.5 mr-2" />Excluir coluna
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="p-2 space-y-2 min-h-16">
                            {colTasks.map(task => (
                                <KanbanCard key={task.id} task={task} columns={columns} currentColId={col.id}
                                    onOpen={onOpen} onComplete={onComplete} onMove={onMove} currentAdminEmail={currentAdminEmail} />
                            ))}
                            {colTasks.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-6">Sem tarefas</p>
                            )}
                        </div>
                    </div>
                )
            })}

            {/* Botão nova coluna */}
            <button onClick={onAddCol}
                className="flex-shrink-0 w-56 h-16 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" />Nova coluna
            </button>
        </div>
    )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params)
    const router = useRouter()

    const [project,      setProject]      = useState<Project | null>(null)
    const [tasks,        setTasks]        = useState<Task[]>([])
    const [members,      setMembers]           = useState<AdminMember[]>([])
    const [columns,      setColumns]           = useState<KanbanColumn[]>([])
    const [currentAdminEmail, setCurrentAdminEmail] = useState('')
    const [loading,      setLoading]           = useState(true)
    const [tab,          setTab]          = useState<TabFilter>('all')
    const [search,       setSearch]       = useState('')
    const [viewMode,     setViewMode]     = useState<ViewMode>('cards')
    const [visibleCols,  setVisibleCols]  = useState<Set<ListCol>>(DEFAULT_LIST_COLS)
    const [taskDialog,   setTaskDialog]   = useState(false)
    const [savingTask,   setSavingTask]   = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [sheetOpen,    setSheetOpen]    = useState(false)
    const [colDialog,    setColDialog]    = useState(false)
    const [editingCol,   setEditingCol]   = useState<KanbanColumn | null>(null)

    const loadAll = useCallback(async () => {
        setLoading(true)
        const [projRes, tasksRes, membRes, colsRes, meRes] = await Promise.all([
            fetch(`/api/admin/projects/${projectId}`),
            fetch(`/api/admin/projects/${projectId}/tasks`),
            fetch('/api/admin/admin-members'),
            fetch(`/api/admin/projects/${projectId}/columns`),
            fetch('/api/admin/me'),
        ])
        if (!projRes.ok) { router.push('/admin/tarefas'); return }
        setProject(await projRes.json())
        if (tasksRes.ok) setTasks(await tasksRes.json())
        if (membRes.ok)  setMembers(await membRes.json())
        if (colsRes.ok)  setColumns(await colsRes.json())
        if (meRes.ok)    setCurrentAdminEmail((await meRes.json()).email ?? '')
        setLoading(false)
    }, [projectId, router])

    useEffect(() => { loadAll() }, [loadAll])

    const doneTasks  = tasks.filter(t => t.done).length
    const totalTasks = tasks.length
    const pct        = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)

    const stateCounts = tasks.reduce((acc, t) => {
        const s = getTaskState(t); acc[s] = (acc[s] ?? 0) + 1; return acc
    }, {} as Record<TaskState, number>)

    const filtered = tasks.filter(t => {
        const matchTab    = viewMode === 'kanban' || tab === 'all' || getTaskState(t) === tab
        const q           = search.trim().toLowerCase()
        const matchSearch = !q || t.title.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.assignee_email?.toLowerCase().includes(q)
        return matchTab && matchSearch
    })

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleCreateTask = async (data: CreateTaskData) => {
        setSavingTask(true)
        const res = await fetch(`/api/admin/projects/${projectId}/tasks`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        if (res.ok) {
            toast.success('Tarefa criada'); setTaskDialog(false); await loadAll()
        } else {
            const body = await res.json(); toast.error(body.error ?? 'Erro ao criar tarefa')
        }
        setSavingTask(false)
    }

    const openTask         = (task: Task) => { setSelectedTask(task); setSheetOpen(true) }
    const handleUpdated    = (t: Task)    => { setTasks(p => p.map(x => x.id === t.id ? { ...x, ...t } : x)); setSelectedTask(t) }
    const handleDeleted    = (id: string) => { setTasks(p => p.filter(t => t.id !== id)); setSelectedTask(null); setSheetOpen(false) }

    // Apenas o responsável (ou tarefas sem responsável) podem ser editadas
    const isOwner = (task: Task) => !task.assignee_email || task.assignee_email === currentAdminEmail

    const getOrCreateDoneColumn = async (): Promise<KanbanColumn | null> => {
        // Reutiliza coluna existente chamada "Concluídos"
        const existing = columns.find(c => c.name.toLowerCase() === 'concluídos')
        if (existing) return existing

        const res = await fetch(`/api/admin/projects/${projectId}/columns`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Concluídos', color: 'green' }),
        })
        if (!res.ok) return null
        const created: KanbanColumn = await res.json()
        setColumns(p => [...p, created])
        return created
    }

    const handleComplete = async (task: Task) => {
        if (!isOwner(task)) {
            toast.error('Apenas o responsável pela tarefa pode alterá-la')
            return
        }
        const newDone = !task.done
        let newColumnId = task.column_id

        if (newDone) {
            // Mover para a coluna "Concluídos" (cria se não existir)
            const doneCol = await getOrCreateDoneColumn()
            if (doneCol) newColumnId = doneCol.id
        } else {
            // Ao desmarcar: se estava na coluna "Concluídos", volta para "Sem coluna"
            const currentCol = columns.find(c => c.id === task.column_id)
            if (currentCol?.name.toLowerCase() === 'concluídos') newColumnId = null
        }

        setTasks(p => p.map(t => t.id === task.id ? { ...t, done: newDone, column_id: newColumnId } : t))
        const res = await fetch(`/api/admin/tasks/${task.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done: newDone, column_id: newColumnId }),
        })
        if (!res.ok) {
            setTasks(p => p.map(t => t.id === task.id ? { ...t, done: task.done, column_id: task.column_id } : t))
            toast.error('Erro ao atualizar tarefa')
        }
    }

    const handleMove = async (task: Task, columnId: string | null) => {
        if (!isOwner(task)) {
            toast.error('Apenas o responsável pela tarefa pode movê-la')
            return
        }
        setTasks(p => p.map(t => t.id === task.id ? { ...t, column_id: columnId } : t))
        const res = await fetch(`/api/admin/tasks/${task.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column_id: columnId }),
        })
        if (!res.ok) {
            setTasks(p => p.map(t => t.id === task.id ? { ...t, column_id: task.column_id } : t))
            toast.error('Erro ao mover tarefa')
        }
    }

    const handleSaveCol = async (name: string, color: string) => {
        if (editingCol) {
            const res = await fetch(`/api/admin/projects/${projectId}/columns/${editingCol.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color }),
            })
            if (res.ok) { setColumns(p => p.map(c => c.id === editingCol.id ? { ...c, name, color } : c)); toast.success('Coluna renomeada') }
            else toast.error('Erro ao renomear coluna')
        } else {
            const res = await fetch(`/api/admin/projects/${projectId}/columns`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color }),
            })
            if (res.ok) {
                const created = await res.json()
                setColumns(p => [...p, created])
                toast.success('Coluna criada')
            } else toast.error('Erro ao criar coluna')
        }
        setColDialog(false); setEditingCol(null)
    }

    const handleDeleteCol = async (col: KanbanColumn) => {
        if (!confirm(`Excluir a coluna "${col.name}"? As tarefas nela ficarão sem coluna.`)) return
        const res = await fetch(`/api/admin/projects/${projectId}/columns/${col.id}`, { method: 'DELETE' })
        if (res.ok) {
            setColumns(p => p.filter(c => c.id !== col.id))
            setTasks(p => p.map(t => t.column_id === col.id ? { ...t, column_id: null } : t))
            toast.success('Coluna excluída')
        } else toast.error('Erro ao excluir coluna')
    }

    const toggleListCol = (col: ListCol) => {
        setVisibleCols(prev => {
            const next = new Set(prev); next.has(col) ? next.delete(col) : next.add(col); return next
        })
    }

    if (loading) return <div className="flex items-center justify-center py-24 text-muted-foreground">Carregando projeto...</div>
    if (!project) return null

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/admin/tarefas" className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />MAF Pro Tasks
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium truncate">{project.name}</span>
            </div>

            {/* Header */}
            <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                            <FolderKanban className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold leading-snug">{project.name}</h1>
                            {project.description && (
                                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                            )}
                        </div>
                    </div>
                    <Badge variant={PROJECT_STATUS_VARIANT[project.status]} className="shrink-0">
                        {PROJECT_STATUS_LABELS[project.status]}
                    </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-foreground">{project.manager_email}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {project.start_date && format(parseISO(project.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        {project.end_date && ` → ${format(parseISO(project.end_date), 'dd/MM/yyyy', { locale: ptBR })}`}
                    </span>
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{doneTasks} de {totalTasks} tarefas concluídas</span>
                        <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {viewMode !== 'kanban' ? (
                    <div className="flex flex-wrap gap-1">
                        {([
                            { value: 'all',     label: `Todas (${totalTasks})` },
                            { value: 'active',  label: `Ativas (${stateCounts.active ?? 0})` },
                            { value: 'overdue', label: `Em atraso (${stateCounts.overdue ?? 0})` },
                            { value: 'done',    label: `Concluídas (${stateCounts.done ?? 0})` },
                        ] as const).map(({ value, label }) => (
                            <button key={value} onClick={() => setTab(value)}
                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                    tab === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}>
                                {label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {totalTasks} tarefas · {doneTasks} concluídas · {stateCounts.overdue ?? 0} em atraso
                    </p>
                )}

                <div className="flex gap-2 w-full sm:w-auto items-center">
                    <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="sm:w-44 h-9" />

                    <div className="flex rounded-md border overflow-hidden shrink-0">
                        {([
                            { mode: 'cards',  Icon: LayoutGrid, title: 'Cards' },
                            { mode: 'list',   Icon: List,       title: 'Lista' },
                            { mode: 'kanban', Icon: Columns3,   title: 'Kanban' },
                        ] as const).map(({ mode, Icon, title }) => (
                            <button key={mode} onClick={() => setViewMode(mode)} title={title}
                                className={`px-2.5 py-1.5 transition-colors ${viewMode === mode ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}>
                                <Icon className="h-4 w-4" />
                            </button>
                        ))}
                    </div>

                    {viewMode === 'list' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" title="Colunas visíveis">
                                    <SlidersHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {ALL_LIST_COLS.map(col => (
                                    <DropdownMenuCheckboxItem key={col.key} checked={visibleCols.has(col.key)} onCheckedChange={() => toggleListCol(col.key)}>
                                        {col.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <Button onClick={() => setTaskDialog(true)} className="shrink-0 h-9">
                        <Plus className="h-4 w-4 mr-1" />Nova Tarefa
                    </Button>
                </div>
            </div>

            {/* Conteúdo */}
            {filtered.length === 0 && viewMode !== 'kanban' ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
                    <Circle className="h-10 w-10 opacity-25" />
                    <p className="text-sm">
                        {search || tab !== 'all' ? 'Nenhuma tarefa para esses filtros.' : 'Nenhuma tarefa neste projeto ainda.'}
                    </p>
                    {!search && tab === 'all' && (
                        <Button variant="outline" size="sm" onClick={() => setTaskDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />Criar tarefa
                        </Button>
                    )}
                </div>
            ) : viewMode === 'cards' ? (
                <CardsView tasks={filtered} onOpen={openTask} onComplete={handleComplete} currentAdminEmail={currentAdminEmail} />
            ) : viewMode === 'list' ? (
                <ListView tasks={filtered} visibleCols={visibleCols} columns={columns} onOpen={openTask} onComplete={handleComplete} currentAdminEmail={currentAdminEmail} />
            ) : (
                <KanbanView
                    tasks={filtered} columns={columns}
                    onOpen={openTask} onComplete={handleComplete} onMove={handleMove}
                    currentAdminEmail={currentAdminEmail}
                    onAddCol={() => { setEditingCol(null); setColDialog(true) }}
                    onRename={col => { setEditingCol(col); setColDialog(true) }}
                    onDelete={handleDeleteCol}
                />
            )}

            {/* Diálogos */}
            <TaskDialog open={taskDialog} members={members} columns={columns}
                onClose={() => setTaskDialog(false)} onSave={handleCreateTask} saving={savingTask} />

            <ColumnDialog open={colDialog} initial={editingCol}
                onClose={() => { setColDialog(false); setEditingCol(null) }}
                onSave={handleSaveCol} />

            <TaskDetailSheet task={selectedTask} members={members} columns={columns} open={sheetOpen}
                currentAdminEmail={currentAdminEmail}
                onClose={() => setSheetOpen(false)} onUpdated={handleUpdated} onDeleted={handleDeleted} />
        </div>
    )
}
