'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    ArrowLeft,
    User,
    CalendarDays,
    AlertCircle,
    CheckCircle2,
    ListTodo,
    FolderKanban,
    RefreshCw,
    Search,
    ClipboardList,
    LayoutGrid,
    List,
    Columns3,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    GripVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Task,
    TaskState,
    TaskPriority,
    AdminMember,
    KanbanColumn,
    TASK_STATE_LABELS,
    TASK_PRIORITY_LABELS,
    TASK_STATE_VARIANT,
    TASK_PRIORITY_VARIANT,
} from '@/lib/types/task-types'
import { TaskDetailSheet } from '@/components/admin/tasks/task-detail-sheet'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Tipos locais ─────────────────────────────────────────────────────────────
interface MyTask extends Task {
    project_name:   string
    project_status: string
}

type TabFilter      = TaskState | 'all'
type PriorityFilter = TaskPriority | 'all'
type ViewMode       = 'cards' | 'list' | 'kanban'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTaskState(task: Pick<Task, 'done' | 'due_datetime'>): TaskState {
    if (task.done) return 'done'
    if (task.due_datetime) {
        const parsed = parseISO(task.due_datetime)
        if (isPast(parsed) && !isToday(parsed)) return 'overdue'
    }
    return 'active'
}

function DueMeta({ dt, done }: { dt: string | null | undefined; done?: boolean }) {
    if (!dt) return null
    const parsed  = parseISO(dt)
    const overdue = !done && isPast(parsed) && !isToday(parsed)
    const today   = !done && isToday(parsed)
    return (
        <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-destructive font-medium' : today ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
            {(overdue || today) && <AlertCircle className="h-3 w-3" />}
            <CalendarDays className="h-3 w-3" />
            {format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </span>
    )
}

function StateBadge({ task }: { task: Task }) {
    const state = getTaskState(task)
    return <Badge variant={TASK_STATE_VARIANT[state]} className="text-xs">{TASK_STATE_LABELS[state]}</Badge>
}

// ─── Helper: borda do topo da coluna kanban ──────────────────────────────────
function getColBorder(color?: string | null): string {
    switch (color) {
        case 'blue':   return 'border-t-blue-400'
        case 'green':  return 'border-t-green-500'
        case 'yellow': return 'border-t-yellow-400'
        case 'orange': return 'border-t-orange-400'
        case 'red':    return 'border-t-red-400'
        case 'purple': return 'border-t-purple-400'
        case 'pink':   return 'border-t-pink-400'
        default:       return 'border-t-muted-foreground/30'
    }
}

const COLUMN_COLORS = [
    { label: 'Cinza',    value: 'slate'  },
    { label: 'Azul',     value: 'blue'   },
    { label: 'Verde',    value: 'green'  },
    { label: 'Amarelo',  value: 'yellow' },
    { label: 'Laranja',  value: 'orange' },
    { label: 'Vermelho', value: 'red'    },
    { label: 'Roxo',     value: 'purple' },
    { label: 'Rosa',     value: 'pink'   },
]

// ─── Diálogo: Nova / Renomear Coluna do sistema ──────────────────────────────
function MyColumnDialog({ open, initial, onClose, onSave }: {
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
                    <DialogDescription className="sr-only">Configure a coluna kanban do sistema.</DialogDescription>
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

// ─── Cartão de tarefa (visão: cards)
function TaskCard({
    task,
    onOpen,
    onToggleDone,
    togglingId,
}: {
    task: MyTask
    onOpen: (t: MyTask) => void
    onToggleDone: (t: MyTask) => void
    togglingId: string | null
}) {
    const toggling = togglingId === task.id

    return (
        <Card
            className="group cursor-pointer hover:shadow-sm hover:border-primary/40 transition-all duration-150"
            onClick={() => onOpen(task)}
        >
            <CardContent className="p-4 space-y-3">
                {/* Linha superior */}
                <div className="flex items-start gap-3">
                    {/* Botão de conclusão */}
                    <button
                        onClick={e => { e.stopPropagation(); onToggleDone(task) }}
                        disabled={toggling}
                        className={`mt-0.5 shrink-0 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                            ${task.done
                                ? 'text-green-500 hover:text-green-600'
                                : 'text-muted-foreground/30 hover:text-green-500'}`}
                        title={task.done ? 'Marcar como pendente' : 'Marcar como concluído'}
                    >
                        <CheckCircle2 className="h-5 w-5" />
                    </button>

                    {/* Título + projeto */}
                    <div className="flex-1 min-w-0 space-y-1">
                        <p className={`text-sm font-medium leading-snug ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                        </p>
                        <Link
                            href={`/admin/tarefas/${task.project_id}`}
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <FolderKanban className="h-3 w-3 shrink-0" />
                            {task.project_name}
                        </Link>
                    </div>
                </div>

                {/* Badges de estado e prioridade */}
                <div className="flex flex-wrap items-center gap-1.5 ml-8">
                    <StateBadge task={task} />
                    <Badge variant={TASK_PRIORITY_VARIANT[task.priority]} className="text-xs">
                        {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                    {(task.subtasks_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ListTodo className="h-3 w-3" />
                            {task.subtasks_done}/{task.subtasks_count}
                        </span>
                    )}
                </div>

                {/* Prazo */}
                {task.due_datetime && (
                    <div className="ml-8">
                        <DueMeta dt={task.due_datetime} done={task.done} />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ─── Visão: Lista ────────────────────────────────────────────────────────────
function MyListView({ tasks, onOpen, onToggleDone, togglingId }: {
    tasks: MyTask[]
    onOpen: (t: MyTask) => void
    onToggleDone: (t: MyTask) => void
    togglingId: string | null
}) {
    return (
        <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
                <thead>
                    <tr className="border-b bg-muted/50">
                        <th className="w-8 p-3" />
                        <th className="text-left p-3 font-medium">Título</th>
                        <th className="text-left p-3 font-medium">Estado</th>
                        <th className="text-left p-3 font-medium">Prioridade</th>
                        <th className="text-left p-3 font-medium">Prazo</th>
                        <th className="text-left p-3 font-medium">Subtarefas</th>
                        <th className="text-left p-3 font-medium">Projeto</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task, i) => (
                        <tr key={task.id}
                            className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}
                            onClick={() => onOpen(task)}>
                            <td className="p-3" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => onToggleDone(task)}
                                    disabled={togglingId === task.id}
                                    className={`rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                        ${task.done ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground/30 hover:text-green-500'}`}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </button>
                            </td>
                            <td className="p-3 max-w-xs">
                                <span className={`font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                                {task.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                            </td>
                            <td className="p-3 whitespace-nowrap"><StateBadge task={task} /></td>
                            <td className="p-3 whitespace-nowrap">
                                <Badge variant={TASK_PRIORITY_VARIANT[task.priority]} className="text-xs">
                                    {TASK_PRIORITY_LABELS[task.priority]}
                                </Badge>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                                <DueMeta dt={task.due_datetime} done={task.done} />
                            </td>
                            <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                {(task.subtasks_count ?? 0) > 0
                                    ? <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" />{task.subtasks_done}/{task.subtasks_count}</span>
                                    : '—'}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                <Link
                                    href={`/admin/tarefas/${task.project_id}`}
                                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                                >
                                    <FolderKanban className="h-3 w-3 shrink-0" />
                                    {task.project_name}
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// ─── Visão: Kanban ────────────────────────────────────────────────────────────
function MyKanbanCard({ task, columns, onOpen, onToggleDone, onMove, togglingId }: {
    task: MyTask
    columns: KanbanColumn[]
    onOpen: (t: MyTask) => void
    onToggleDone: (t: MyTask) => void
    onMove: (task: MyTask, colId: string | null) => void
    togglingId: string | null
}) {
    const toggling = togglingId === task.id
    const currentColId = task.column_id ?? null
    const destinations = currentColId
        ? ([{ id: null, name: 'Sem coluna' }, ...columns.filter(c => c.id !== currentColId)] as { id: string | null; name: string }[])
        : (columns.map(c => ({ id: c.id as string | null, name: c.name })))

    return (
        <Card
            className="group cursor-pointer hover:shadow-sm hover:border-primary/40 transition-all duration-150"
            onClick={() => onOpen(task)}
        >
            <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                    <div className="mt-0.5" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => onToggleDone(task)}
                            disabled={toggling}
                            className={`rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                ${task.done ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground/30 hover:text-green-500'}`}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                        </button>
                    </div>
                    <p className={`text-sm font-medium leading-snug flex-1 min-w-0 ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                    </p>
                    {destinations.length > 0 && (
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
                    {(task.subtasks_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ListTodo className="h-3 w-3" />{task.subtasks_done}/{task.subtasks_count}
                        </span>
                    )}
                </div>
                {task.due_datetime && <DueMeta dt={task.due_datetime} done={task.done} />}
                <Link
                    href={`/admin/tarefas/${task.project_id}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <FolderKanban className="h-3 w-3 shrink-0" />
                    {task.project_name}
                </Link>
            </CardContent>
        </Card>
    )
}

function MyKanbanView({ tasks, systemColumns, isMaster, onOpen, onToggleDone, onMove, onAddCol, onRename, onDelete, togglingId }: {
    tasks: MyTask[]
    systemColumns: KanbanColumn[]
    isMaster: boolean
    onOpen: (t: MyTask) => void
    onToggleDone: (t: MyTask) => void
    onMove: (task: MyTask, colId: string | null) => void
    onAddCol: () => void
    onRename: (col: KanbanColumn) => void
    onDelete: (col: KanbanColumn) => void
    togglingId: string | null
}) {
    const unassigned = tasks.filter(t => !t.column_id || !systemColumns.find(c => c.id === t.column_id))

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 items-start">
            {/* Sem coluna */}
            {unassigned.length > 0 && (
                <div className="flex-shrink-0 w-72 rounded-lg border border-t-4 border-t-muted-foreground/30 bg-muted/20">
                    <div className="p-3 border-b bg-background/50 flex items-center gap-2">
                        <span className="font-medium text-sm text-muted-foreground flex-1">Sem coluna</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">{unassigned.length}</span>
                    </div>
                    <div className="p-2 space-y-2 min-h-16">
                        {unassigned.map(task => (
                            <MyKanbanCard key={task.id} task={task} columns={systemColumns}
                                onOpen={onOpen} onToggleDone={onToggleDone} onMove={onMove} togglingId={togglingId} />
                        ))}
                    </div>
                </div>
            )}

            {/* Colunas do sistema */}
            {systemColumns.map(col => {
                const colTasks = tasks.filter(t => t.column_id === col.id)
                return (
                    <div key={col.id} className={`flex-shrink-0 w-72 rounded-lg border border-t-4 bg-muted/20 ${getColBorder(col.color)}`}>
                        <div className="p-3 border-b bg-background/50 flex items-center justify-between">
                            <span className="font-medium text-sm truncate flex-1">{col.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">{colTasks.length}</span>
                                {/* Gerenciamento de coluna: apenas master */}
                                {isMaster && (
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
                                )}
                            </div>
                        </div>
                        <div className="p-2 space-y-2 min-h-16">
                            {colTasks.map(task => (
                                <MyKanbanCard key={task.id} task={task} columns={systemColumns}
                                    onOpen={onOpen} onToggleDone={onToggleDone} onMove={onMove} togglingId={togglingId} />
                            ))}
                            {colTasks.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-6">Sem tarefas</p>
                            )}
                        </div>
                    </div>
                )
            })}

            {/* Botão nova coluna: apenas master */}
            {isMaster && (
                <button onClick={onAddCol}
                    className="flex-shrink-0 w-56 h-16 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4" />Nova coluna
                </button>
            )}
        </div>
    )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function MinhasTarefasPage() {
    const [tasks, setTasks]           = useState<MyTask[]>([])
    const [myEmail, setMyEmail]       = useState<string>('')
    const [isMaster, setIsMaster]     = useState(false)
    const [loading, setLoading]       = useState(true)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [selectedTask, setSelectedTask] = useState<MyTask | null>(null)
    const [sheetOpen, setSheetOpen]   = useState(false)
    const [members, setMembers]       = useState<AdminMember[]>([])
    const [systemColumns, setSystemColumns] = useState<KanbanColumn[]>([])

    // Gerenciamento de colunas (apenas master)
    const [colDialog, setColDialog]   = useState(false)
    const [editingCol, setEditingCol] = useState<KanbanColumn | null>(null)

    // Filtros
    const [tab, setTab]           = useState<TabFilter>('all')
    const [priority, setPriority] = useState<PriorityFilter>('all')
    const [search, setSearch]     = useState('')
    const [viewMode, setViewMode] = useState<ViewMode>('cards')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [tasksRes, membersRes, colsRes, meRes] = await Promise.all([
                fetch('/api/admin/tasks/my-tasks'),
                fetch('/api/admin/admin-members'),
                fetch('/api/admin/tasks/system-columns'),
                fetch('/api/admin/me'),
            ])
            if (!tasksRes.ok) throw new Error('Falha ao carregar tarefas')
            const data = await tasksRes.json()
            setTasks(data.tasks ?? [])
            setMyEmail(data.email ?? '')
            if (membersRes.ok) setMembers(await membersRes.json())
            if (colsRes.ok)    setSystemColumns(await colsRes.json())
            if (meRes.ok) {
                const meData = await meRes.json()
                setMyEmail(meData.email ?? data.email ?? '')
                setIsMaster(meData.role === 'master')
            }
        } catch {
            toast.error('Erro ao carregar suas tarefas')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    // Abre o sheet usando as colunas do sistema já carregadas
    const openTask = useCallback(async (task: MyTask) => {
        setSelectedTask(task)
        setSheetOpen(true)
    }, [])

    // Ao fechar o sheet, recarrega para refletir mudanças feitas dentro do detalhe
    const handleSheetClose = useCallback(() => {
        setSheetOpen(false)
        setSelectedTask(null)
        load()
    }, [load])

    // Alternar conclusão
    const toggleDone = useCallback(async (task: MyTask) => {
        setTogglingId(task.id)
        try {
            const res = await fetch(`/api/admin/tasks/${task.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: !task.done }),
            })
            if (!res.ok) throw new Error()
            setTasks(prev => prev.map(t =>
                t.id === task.id ? { ...t, done: !t.done } : t
            ))
            toast.success(task.done ? 'Tarefa reaberta' : 'Tarefa concluída!')
        } catch {
            toast.error('Erro ao atualizar tarefa')
        } finally {
            setTogglingId(null)
        }
    }, [])

    // Mover tarefa para outra coluna do sistema
    const handleMove = useCallback(async (task: MyTask, colId: string | null) => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, column_id: colId } : t))
        const res = await fetch(`/api/admin/tasks/${task.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column_id: colId }),
        })
        if (!res.ok) {
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, column_id: task.column_id } : t))
            toast.error('Erro ao mover tarefa')
        }
    }, [])

    // Gerenciamento de colunas do sistema (apenas master)
    const handleSaveCol = useCallback(async (name: string, color: string) => {
        if (editingCol) {
            const res = await fetch(`/api/admin/tasks/system-columns/${editingCol.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color }),
            })
            if (res.ok) {
                setSystemColumns(p => p.map(c => c.id === editingCol.id ? { ...c, name, color } : c))
                toast.success('Coluna renomeada')
            } else toast.error('Erro ao renomear coluna')
        } else {
            const res = await fetch('/api/admin/tasks/system-columns', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color }),
            })
            if (res.ok) {
                const created = await res.json()
                setSystemColumns(p => [...p, created])
                toast.success('Coluna criada')
            } else toast.error('Erro ao criar coluna')
        }
        setColDialog(false); setEditingCol(null)
    }, [editingCol])

    const handleDeleteCol = useCallback(async (col: KanbanColumn) => {
        if (!confirm(`Excluir a coluna "${col.name}"? As tarefas nela ficarão sem coluna.`)) return
        const res = await fetch(`/api/admin/tasks/system-columns/${col.id}`, { method: 'DELETE' })
        if (res.ok) {
            setSystemColumns(p => p.filter(c => c.id !== col.id))
            setTasks(p => p.map(t => t.column_id === col.id ? { ...t, column_id: null } : t))
            toast.success('Coluna excluída')
        } else toast.error('Erro ao excluir coluna')
    }, [])

    // Filtros aplicados
    const filtered = tasks.filter(task => {
        const state = getTaskState(task)
        if (tab !== 'all' && state !== tab) return false
        if (priority !== 'all' && task.priority !== priority) return false
        if (search.trim()) {
            const q = search.trim().toLowerCase()
            if (!task.title.toLowerCase().includes(q) && !task.project_name.toLowerCase().includes(q)) return false
        }
        return true
    })

    // Contagens para as abas
    const counts: Record<TabFilter, number> = {
        all:     tasks.length,
        active:  tasks.filter(t => getTaskState(t) === 'active').length,
        overdue: tasks.filter(t => getTaskState(t) === 'overdue').length,
        done:    tasks.filter(t => getTaskState(t) === 'done').length,
    }

    const TAB_OPTIONS: { value: TabFilter; label: string }[] = [
        { value: 'all',     label: 'Todas' },
        { value: 'active',  label: 'Ativas' },
        { value: 'overdue', label: 'Em atraso' },
        { value: 'done',    label: 'Concluídas' },
    ]

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Link
                            href="/admin/tarefas/dashboard"
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            MAF Pro Tasks
                        </Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Minhas Tarefas</span>
                    </div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <User className="h-6 w-6" />
                        Minhas Tarefas
                    </h1>
                    {myEmail && (
                        <p className="text-muted-foreground text-sm mt-1">
                            Tarefas atribuídas a <span className="font-medium">{myEmail}</span> em todos os projetos
                        </p>
                    )}
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start sm:self-center">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Abas de estado */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit flex-wrap">
                    {TAB_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setTab(opt.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                ${tab === opt.value
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {opt.label}
                            {counts[opt.value] > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                                    ${tab === opt.value
                                        ? opt.value === 'overdue' ? 'bg-destructive/15 text-destructive'
                                            : opt.value === 'done' ? 'bg-green-500/15 text-green-700'
                                            : 'bg-primary/10 text-primary'
                                        : 'bg-muted-foreground/15 text-muted-foreground'}`}
                                >
                                    {counts[opt.value]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 flex-1">
                    {/* Filtro de prioridade */}
                    <Select value={priority} onValueChange={v => setPriority(v as PriorityFilter)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as prioridades</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="low">Baixa</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Busca */}
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar tarefa ou projeto..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {/* Modo de visualização */}
                    <div className="flex rounded-md border overflow-hidden shrink-0">
                        {([
                            { mode: 'cards'  as ViewMode, Icon: LayoutGrid, title: 'Cards' },
                            { mode: 'list'   as ViewMode, Icon: List,       title: 'Lista' },
                            { mode: 'kanban' as ViewMode, Icon: Columns3,   title: 'Kanban' },
                        ]).map(({ mode, Icon, title }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                title={title}
                                className={`px-2.5 py-1.5 transition-colors ${
                                    viewMode === mode
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Conteúdo */}
            {loading ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    Carregando suas tarefas...
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                    <ClipboardList className="h-12 w-12 opacity-25" />
                    <p className="text-base font-medium">
                        {tasks.length === 0
                            ? 'Nenhuma tarefa atribuída a você'
                            : 'Nenhuma tarefa encontrada com os filtros aplicados'}
                    </p>
                    {tasks.length === 0 && (
                        <p className="text-sm">As tarefas atribuídas ao seu usuário aparecerão aqui.</p>
                    )}
                </div>
            ) : viewMode === 'cards' ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onOpen={openTask}
                            onToggleDone={toggleDone}
                            togglingId={togglingId}
                        />
                    ))}
                </div>
            ) : viewMode === 'list' ? (
                <MyListView
                    tasks={filtered}
                    onOpen={openTask}
                    onToggleDone={toggleDone}
                    togglingId={togglingId}
                />
            ) : (
                <MyKanbanView
                    tasks={filtered}
                    systemColumns={systemColumns}
                    isMaster={isMaster}
                    onOpen={openTask}
                    onToggleDone={toggleDone}
                    onMove={handleMove}
                    onAddCol={() => { setEditingCol(null); setColDialog(true) }}
                    onRename={col => { setEditingCol(col); setColDialog(true) }}
                    onDelete={handleDeleteCol}
                    togglingId={togglingId}
                />
            )}

            {/* Diálogo de coluna (apenas master) */}
            <MyColumnDialog
                open={colDialog}
                initial={editingCol}
                onClose={() => { setColDialog(false); setEditingCol(null) }}
                onSave={handleSaveCol}
            />

            {/* Sheet de detalhe */}
            <TaskDetailSheet
                task={selectedTask}
                open={sheetOpen}
                members={members}
                columns={systemColumns}
                currentAdminEmail={myEmail}
                projectName={selectedTask?.project_name}
                onClose={handleSheetClose}
                onUpdated={updatedTask => {
                    setTasks(prev => prev.map(t =>
                        t.id === updatedTask.id ? { ...t, ...updatedTask } : t
                    ))
                }}
                onDeleted={deletedId => {
                    setTasks(prev => prev.filter(t => t.id !== deletedId))
                    setSheetOpen(false)
                    setSelectedTask(null)
                }}
            />
        </div>
    )
}
