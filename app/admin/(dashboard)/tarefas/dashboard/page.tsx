'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    FolderKanban,
    LayoutDashboard,
    User,
    ArrowRight,
    RefreshCw,
    CalendarDays,
    TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_VARIANT } from '@/lib/types/task-types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Tipos locais ─────────────────────────────────────────────────────────────
type Period = 'today' | 'week' | 'month' | 'all'

interface TaskSummary {
    id:            string
    title:         string
    done:          boolean
    due_datetime:  string | null
    priority:      string
    project_id:    string
    project_name:  string
    assignee_email:string | null
}

interface ProjectStat {
    project_id:   string
    project_name: string
    status:       string
    total:        number
    done:         number
    overdue:      number
    active:       number
}

interface Stats {
    total:          number
    done:           number
    overdue:        number
    active:         number
    projects_count: number
    today_tasks:    TaskSummary[]
    overdue_tasks:  TaskSummary[]
    by_project:     ProjectStat[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDatetime(d: string | null | undefined) {
    if (!d) return null
    return format(parseISO(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR })
}

const PERIOD_LABELS: Record<Period, string> = {
    today: 'Hoje',
    week:  'Esta semana',
    month: 'Este mês',
    all:   'Todos',
}

// ─── Componentes ──────────────────────────────────────────────────────────────
function StatCard({
    label, value, icon: Icon, color, sublabel,
}: {
    label: string; value: number; icon: React.ElementType; color: string; sublabel?: string
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">{label}</p>
                        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                        {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
                    </div>
                    <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100')} shrink-0`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function TaskRow({ task, showProject = true }: { task: TaskSummary; showProject?: boolean }) {
    const priority = task.priority as keyof typeof TASK_PRIORITY_LABELS
    return (
        <div className="flex items-start gap-3 py-3 border-b last:border-0">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/40" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {showProject && (
                        <Link href={`/admin/tarefas/${task.project_id}`}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                            <FolderKanban className="h-3 w-3" />{task.project_name}
                        </Link>
                    )}
                    {task.due_datetime && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />{fmtDate(task.due_datetime)}
                        </span>
                    )}
                    {task.assignee_email && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />{task.assignee_email.split('@')[0]}
                        </span>
                    )}
                </div>
            </div>
            <Badge variant={TASK_PRIORITY_VARIANT[priority]} className="text-xs shrink-0">
                {TASK_PRIORITY_LABELS[priority]}
            </Badge>
        </div>
    )
}

function ProgressBar({ done, total }: { done: number; total: number }) {
    const pct = total === 0 ? 0 : Math.round((done / total) * 100)
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{done}/{total} concluídas</span>
                <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function TasksDashboardPage() {
    const [stats,   setStats]   = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [period,  setPeriod]  = useState<Period>('today')

    const loadStats = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/tasks/stats')
            if (res.ok) setStats(await res.json())
            else toast.error('Erro ao carregar estatísticas')
        } catch {
            toast.error('Erro ao carregar dashboard')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadStats() }, [loadStats])

    // Filtra tarefas por período para a seção "próximas"
    const upcomingByPeriod = (() => {
        if (!stats) return []
        const now   = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const dayEnd = (offset: number) => {
            const d = new Date(start)
            d.setDate(d.getDate() + offset)
            d.setHours(23, 59, 59, 999)
            return d
        }

        // Todas tarefas não concluídas e sem atraso (ativas futuras + hoje)
        const base = [
            ...stats.today_tasks,
            // tarefas ativas que têm prazo futuro (não estão em today_tasks nem overdue)
        ]

        if (period === 'today')  return stats.today_tasks
        if (period === 'week')   return base.filter(t => t.due_datetime && new Date(t.due_datetime) <= dayEnd(6))
        if (period === 'month')  return base.filter(t => t.due_datetime && new Date(t.due_datetime) <= dayEnd(29))
        return base
    })()

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin opacity-40" />
                    <p className="text-sm">Carregando dashboard...</p>
                </div>
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutDashboard className="h-6 w-6" />
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Visão geral de todas as tarefas e projetos.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadStats} className="gap-2">
                        <RefreshCw className="h-3.5 w-3.5" />Atualizar
                    </Button>
                    <Link href="/admin/tarefas/projetos">
                        <Button size="sm" className="gap-2">
                            <FolderKanban className="h-3.5 w-3.5" />Ver Projetos
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Cards de stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Tarefas Ativas"
                    value={stats.active}
                    icon={Clock}
                    color="text-blue-600"
                    sublabel="sem prazo vencido"
                />
                <StatCard
                    label="Concluídas"
                    value={stats.done}
                    icon={CheckCircle2}
                    color="text-green-600"
                    sublabel={`de ${stats.total} no total`}
                />
                <StatCard
                    label="Em Atraso"
                    value={stats.overdue}
                    icon={AlertCircle}
                    color="text-red-600"
                    sublabel="prazo vencido"
                />
                <StatCard
                    label="Projetos"
                    value={stats.projects_count}
                    icon={FolderKanban}
                    color="text-purple-600"
                    sublabel="total de projetos"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Coluna principal — 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tarefas para hoje */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-blue-500" />
                                    Tarefas para hoje
                                    {stats.today_tasks.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 text-xs">{stats.today_tasks.length}</Badge>
                                    )}
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {stats.today_tasks.length === 0 ? (
                                <div className="flex flex-col items-center py-8 gap-2 text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 opacity-25" />
                                    <p className="text-sm">Nenhuma tarefa com prazo para hoje.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {stats.today_tasks.map(task => (
                                        <TaskRow key={task.id} task={task} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Em atraso */}
                    {stats.overdue_tasks.length > 0 && (
                        <Card className="border-red-200 dark:border-red-900/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4" />
                                    Em atraso
                                    <Badge variant="destructive" className="ml-1 text-xs">{stats.overdue_tasks.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y">
                                    {stats.overdue_tasks.slice(0, 8).map(task => (
                                        <TaskRow key={task.id} task={task} />
                                    ))}
                                </div>
                                {stats.overdue_tasks.length > 8 && (
                                    <p className="text-xs text-muted-foreground text-center mt-3">
                                        +{stats.overdue_tasks.length - 8} tarefas em atraso
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Coluna lateral — 1/3 */}
                <div className="space-y-6">
                    {/* Progresso por projeto */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-purple-500" />
                                Progresso por Projeto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {stats.by_project.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhum projeto encontrado.</p>
                            ) : (
                                stats.by_project.map(proj => (
                                    <div key={proj.project_id} className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <Link
                                                href={`/admin/tarefas/${proj.project_id}`}
                                                className="text-sm font-medium truncate hover:text-primary transition-colors flex-1 min-w-0"
                                            >
                                                {proj.project_name}
                                            </Link>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {proj.overdue > 0 && (
                                                    <span className="text-xs text-red-500 flex items-center gap-0.5">
                                                        <AlertCircle className="h-3 w-3" />{proj.overdue}
                                                    </span>
                                                )}
                                                <Link href={`/admin/tarefas/${proj.project_id}`}>
                                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                                                </Link>
                                            </div>
                                        </div>
                                        <ProgressBar done={proj.done} total={proj.total} />
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Resumo rápido */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Resumo Geral</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { label: 'Total de tarefas',  value: stats.total,   color: '' },
                                { label: 'Concluídas',        value: stats.done,    color: 'text-green-600' },
                                { label: 'Ativas',            value: stats.active,  color: 'text-blue-600' },
                                { label: 'Em atraso',         value: stats.overdue, color: 'text-red-600' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className={`font-semibold ${color}`}>{value}</span>
                                </div>
                            ))}
                            <div className="pt-2 border-t">
                                <ProgressBar
                                    done={stats.done}
                                    total={stats.total}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
