'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Plus,
    FolderKanban,
    MoreVertical,
    Pencil,
    Trash2,
    CalendarDays,
    User,
    ArrowRight,
    CheckCircle2,
    Archive,
    ArchiveRestore,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Project,
    ProjectStatus,
    CreateProjectData,
    PROJECT_STATUS_LABELS,
    PROJECT_STATUS_VARIANT,
    AdminMember,
} from '@/lib/types/task-types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR })
}

function ProgressBar({ done, total }: { done: number; total: number }) {
    const pct = total === 0 ? 0 : Math.round((done / total) * 100)
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{done}/{total} tarefas concluídas</span>
                <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

// ─── Formulário de Projeto ────────────────────────────────────────────────────
interface ProjectFormData {
    name:          string
    description:   string
    manager_email: string
    status:        ProjectStatus
    start_date:    string
    end_date:      string
}

const emptyForm: ProjectFormData = {
    name:          '',
    description:   '',
    manager_email: '',
    status:        'active',
    start_date:    '',
    end_date:      '',
}

interface ProjectDialogProps {
    open:     boolean
    project?: Project | null
    members:  AdminMember[]
    onClose:  () => void
    onSave:   (data: CreateProjectData) => Promise<void>
    saving:   boolean
}

function ProjectDialog({ open, project, members, onClose, onSave, saving }: ProjectDialogProps) {
    const [form, setForm] = useState<ProjectFormData>(emptyForm)

    useEffect(() => {
        if (project) {
            setForm({
                name:          project.name,
                description:   project.description ?? '',
                manager_email: project.manager_email,
                status:        project.status,
                start_date:    project.start_date,
                end_date:      project.end_date ?? '',
            })
        } else {
            setForm(emptyForm)
        }
    }, [project, open])

    const set = (field: keyof ProjectFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setForm(f => ({ ...f, [field]: e.target.value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim())      { toast.error('Nome é obrigatório'); return }
        if (!form.manager_email)    { toast.error('Gerente é obrigatório'); return }
        if (!form.start_date)       { toast.error('Data de início é obrigatória'); return }
        await onSave({
            name:          form.name.trim(),
            description:   form.description.trim() || undefined,
            manager_email: form.manager_email,
            status:        form.status,
            start_date:    form.start_date,
            end_date:      form.end_date || undefined,
        })
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
                    <DialogDescription className="sr-only">Preencha os dados do projeto.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="proj-name">Nome *</Label>
                        <Input id="proj-name" value={form.name} onChange={set('name')} placeholder="Nome do projeto" required />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="proj-desc">Descrição</Label>
                        <Textarea id="proj-desc" value={form.description} onChange={set('description')} placeholder="Descreva o objetivo do projeto..." rows={3} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Gerente *</Label>
                            <Select value={form.manager_email} onValueChange={v => setForm(f => ({ ...f, manager_email: v }))}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    {members.map(m => (
                                        <SelectItem key={m.email} value={m.email}>
                                            {m.name} ({m.role === 'master' ? 'Master' : 'Operador'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ProjectStatus }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(([v, l]) => (
                                        <SelectItem key={v} value={v}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="proj-start">Data de Início *</Label>
                            <Input id="proj-start" type="date" value={form.start_date} onChange={set('start_date')} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="proj-end">Data de Fim</Label>
                            <Input id="proj-end" type="date" value={form.end_date} onChange={set('end_date')} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Salvando...' : project ? 'Salvar alterações' : 'Criar projeto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Card de Projeto ──────────────────────────────────────────────────────────
function ProjectCard({
    project, onEdit, onDelete, onArchive, onRestore,
}: {
    project: Project
    onEdit:    (p: Project) => void
    onDelete:  (p: Project) => void
    onArchive: (p: Project) => void
    onRestore: (p: Project) => void
}) {
    const hasTasks = (project.tasks_count ?? 0) > 0

    return (
        <Card className={`group hover:shadow-md transition-all duration-200 flex flex-col ${
            project.is_archived
                ? 'opacity-70 border-dashed hover:border-muted-foreground/40'
                : 'hover:border-primary/40'
        }`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${project.is_archived ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                            {project.is_archived
                                ? <Archive className="h-4 w-4" />
                                : <FolderKanban className="h-4 w-4" />
                            }
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-base leading-snug truncate group-hover:text-primary transition-colors">
                                {project.name}
                            </CardTitle>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {project.is_archived ? (
                            <Badge variant="secondary" className="text-xs">Arquivado</Badge>
                        ) : (
                            <Badge variant={PROJECT_STATUS_VARIANT[project.status]} className="text-xs">
                                {PROJECT_STATUS_LABELS[project.status]}
                            </Badge>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {project.is_archived ? (
                                    <>
                                        <DropdownMenuItem onClick={() => onRestore(project)}>
                                            <ArchiveRestore className="h-4 w-4 mr-2" />Restaurar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {!hasTasks && (
                                            <DropdownMenuItem onClick={() => onDelete(project)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="h-4 w-4 mr-2" />Excluir permanentemente
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <DropdownMenuItem onClick={() => onEdit(project)}>
                                            <Pencil className="h-4 w-4 mr-2" />Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onArchive(project)}>
                                            <Archive className="h-4 w-4 mr-2" />Arquivar
                                        </DropdownMenuItem>
                                        {!hasTasks && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onDelete(project)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />Excluir
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {project.description && (
                    <CardDescription className="mt-2 line-clamp-2 text-xs">{project.description}</CardDescription>
                )}
            </CardHeader>

            <CardContent className="pt-0 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span className="truncate">{project.manager_email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{fmtDate(project.start_date)} → {fmtDate(project.end_date)}</span>
                    </div>
                    {(project.tasks_count ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span>{project.tasks_done}/{project.tasks_count} tarefas</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <ProgressBar done={project.tasks_done ?? 0} total={project.tasks_count ?? 0} />
                    {!project.is_archived && (
                        <Link href={`/admin/tarefas/${project.id}`}>
                            <Button variant="outline" size="sm" className="w-full gap-2 group-hover:border-primary/50 transition-colors">
                                Ver tarefas
                                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ProjetosPage() {
    const [projects,    setProjects]    = useState<Project[]>([])
    const [members,     setMembers]     = useState<AdminMember[]>([])
    const [loading,     setLoading]     = useState(true)
    const [search,      setSearch]      = useState('')
    const [activeTab,   setActiveTab]   = useState<'active' | 'archived'>('active')
    const [dialogOpen,  setDialogOpen]  = useState(false)
    const [editProject, setEditProject] = useState<Project | null>(null)
    const [saving,      setSaving]      = useState(false)

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [projRes, membRes] = await Promise.all([
                fetch('/api/admin/projects'),
                fetch('/api/admin/admin-members'),
            ])
            if (projRes.ok)  setProjects(await projRes.json())
            if (membRes.ok)  setMembers(await membRes.json())
            else toast.warning('Não foi possível carregar administradores')
        } catch {
            toast.error('Erro ao carregar dados')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const filtered = projects.filter(p => {
        const matchesTab = activeTab === 'active' ? !p.is_archived : p.is_archived
        const matchesSearch = !search.trim() ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase()) ||
            p.manager_email.toLowerCase().includes(search.toLowerCase())
        return matchesTab && matchesSearch
    })

    // Apenas projetos ativos nas estatísticas
    const activeProjects = projects.filter(p => !p.is_archived)

    const handleSave = async (data: CreateProjectData) => {
        setSaving(true)
        try {
            const url    = editProject ? `/api/admin/projects/${editProject.id}` : '/api/admin/projects'
            const method = editProject ? 'PATCH' : 'POST'
            const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
            if (res.ok) {
                toast.success(editProject ? 'Projeto atualizado' : 'Projeto criado!')
                setDialogOpen(false); setEditProject(null)
                await loadData()
            } else {
                toast.error((await res.json()).error ?? 'Erro ao salvar projeto')
            }
        } finally { setSaving(false) }
    }

    const handleDelete = async (project: Project) => {
        if (!confirm(`Excluir permanentemente o projeto "${project.name}"? Esta ação não pode ser desfeita.`)) return
        const res = await fetch(`/api/admin/projects/${project.id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Projeto excluído'); await loadData() }
        else {
            const body = await res.json()
            toast.error(body.error ?? 'Erro ao excluir projeto')
        }
    }

    const handleArchive = async (project: Project) => {
        if (!confirm(`Arquivar o projeto "${project.name}"? Todas as tarefas vinculadas também serão arquivadas e não aparecerão nos relatórios.`)) return
        const res = await fetch(`/api/admin/projects/${project.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_archived: true }),
        })
        if (res.ok) {
            toast.success('Projeto arquivado com sucesso')
            setActiveTab('archived')
            await loadData()
        } else {
            const body = await res.json()
            toast.error(body.error ?? 'Erro ao arquivar projeto')
        }
    }

    const handleRestore = async (project: Project) => {
        const res = await fetch(`/api/admin/projects/${project.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_archived: false }),
        })
        if (res.ok) {
            toast.success('Projeto restaurado com sucesso')
            setActiveTab('active')
            await loadData()
        } else {
            const body = await res.json()
            toast.error(body.error ?? 'Erro ao restaurar projeto')
        }
    }

    const openNew  = () => { setEditProject(null); setDialogOpen(true) }
    const openEdit = (p: Project) => { setEditProject(p); setDialogOpen(true) }

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FolderKanban className="h-6 w-6" />
                        Projetos
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Gerencie os projetos e acesse as tarefas de cada um.
                    </p>
                </div>
                <Button onClick={openNew} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />Novo Projeto
                </Button>
            </div>

            {/* Resumo rápido — apenas projetos ativos */}
            {activeProjects.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total de Projetos', value: activeProjects.length,                                           color: '' },
                        { label: 'Projetos Ativos',   value: activeProjects.filter(p => p.status === 'active').length,        color: 'text-green-600' },
                        { label: 'Total de Tarefas',  value: activeProjects.reduce((s, p) => s + (p.tasks_count ?? 0), 0),    color: '' },
                        { label: 'Concluídas',        value: activeProjects.reduce((s, p) => s + (p.tasks_done  ?? 0), 0),    color: 'text-green-600' },
                    ].map(({ label, value, color }) => (
                        <Card key={label}>
                            <CardHeader className="p-4 pb-1">
                                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <span className={`text-2xl font-bold ${color}`}>{value}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Busca + Tabs */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <Input
                    placeholder="Buscar projetos..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <div className="flex gap-1 rounded-lg border p-1 bg-muted/40">
                    <button
                        onClick={() => { setActiveTab('active'); setSearch('') }}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            activeTab === 'active'
                                ? 'bg-background shadow-sm font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Ativos
                        {activeProjects.length > 0 && (
                            <span className="ml-1.5 text-xs text-muted-foreground">({activeProjects.length})</span>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveTab('archived'); setSearch('') }}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                            activeTab === 'archived'
                                ? 'bg-background shadow-sm font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Archive className="h-3.5 w-3.5" />
                        Arquivados
                        {projects.filter(p => p.is_archived).length > 0 && (
                            <span className="text-xs text-muted-foreground">({projects.filter(p => p.is_archived).length})</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando projetos...</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center text-muted-foreground">
                    {activeTab === 'archived' ? (
                        <>
                            <Archive className="h-12 w-12 opacity-25" />
                            <p className="text-sm">{search ? 'Nenhum projeto arquivado encontrado.' : 'Nenhum projeto arquivado.'}</p>
                        </>
                    ) : (
                        <>
                            <FolderKanban className="h-12 w-12 opacity-25" />
                            <p className="text-sm">{search ? 'Nenhum projeto encontrado.' : 'Nenhum projeto criado ainda. Comece criando o primeiro!'}</p>
                            {!search && (
                                <Button variant="outline" size="sm" onClick={openNew}>
                                    <Plus className="h-4 w-4 mr-2" />Criar projeto
                                </Button>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(p => (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onArchive={handleArchive}
                            onRestore={handleRestore}
                        />
                    ))}
                </div>
            )}

            <ProjectDialog
                open={dialogOpen}
                project={editProject}
                members={members}
                onClose={() => { setDialogOpen(false); setEditProject(null) }}
                onSave={handleSave}
                saving={saving}
            />
        </div>
    )
}
