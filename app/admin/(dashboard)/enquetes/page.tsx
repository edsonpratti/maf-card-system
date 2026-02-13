'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Edit, Copy, Trash2, BarChart3 } from 'lucide-react'
import { Survey, SurveyStatus } from '@/lib/types/survey-types'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function EnquetesPage() {
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<SurveyStatus | 'all'>('all')

    useEffect(() => {
        loadSurveys()
    }, [])

    const loadSurveys = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/surveys')
            if (response.ok) {
                const data = await response.json()
                setSurveys(data)
            }
        } catch (error) {
            console.error('Error loading surveys:', error)
            toast.error('Erro ao carregar enquetes')
        } finally {
            setLoading(false)
        }
    }

    const copyPublicLink = (code: string) => {
        const url = `${window.location.origin}/enquete/${code}`
        navigator.clipboard.writeText(url)
        toast.success('Link copiado para a área de transferência!')
    }

    const deleteSurvey = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta enquete?')) return

        try {
            const response = await fetch(`/api/admin/surveys/${id}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                toast.success('Enquete excluída com sucesso')
                loadSurveys()
            } else {
                toast.error('Erro ao excluir enquete')
            }
        } catch (error) {
            console.error('Error deleting survey:', error)
            toast.error('Erro ao excluir enquete')
        }
    }

    const getStatusBadge = (status: SurveyStatus) => {
        const variants: Record<SurveyStatus, { label: string; variant: 'success' | 'secondary' | 'outline' }> = {
            draft: { label: 'Rascunho', variant: 'secondary' },
            active: { label: 'Ativa', variant: 'success' },
            closed: { label: 'Encerrada', variant: 'outline' }
        }
        const config = variants[status]
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const filteredSurveys = filter === 'all'
        ? surveys
        : surveys.filter(s => s.status === filter)

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Enquetes</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Crie e gerencie enquetes e questionários para seu público
                    </p>
                </div>
                <Link href="/admin/enquetes/nova">
                    <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Enquete
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    Todas
                </Button>
                <Button
                    variant={filter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('active')}
                >
                    Ativas
                </Button>
                <Button
                    variant={filter === 'draft' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('draft')}
                >
                    Rascunhos
                </Button>
                <Button
                    variant={filter === 'closed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('closed')}
                >
                    Encerradas
                </Button>
            </div>

            {/* Surveys List */}
            {loading ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        Carregando enquetes...
                    </CardContent>
                </Card>
            ) : filteredSurveys.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground mb-4">
                            {filter === 'all'
                                ? 'Nenhuma enquete criada ainda'
                                : `Nenhuma enquete ${filter === 'active' ? 'ativa' : filter === 'draft' ? 'em rascunho' : 'encerrada'}`}
                        </p>
                        {filter === 'all' && (
                            <Link href="/admin/enquetes/nova">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Primeira Enquete
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredSurveys.map(survey => {
                        const publicIdentifier = survey.code?.trim() || survey.id
                        return (
                            <Card key={survey.id}>
                            <CardHeader className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <CardTitle className="text-base sm:text-lg truncate">{survey.name}</CardTitle>
                                            {getStatusBadge(survey.status)}
                                        </div>
                                        {survey.description && (
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                {survey.description}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-muted-foreground">
                                            <span>Código: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{survey.code}</code></span>
                                            <span>Início: {format(new Date(survey.start_date), 'dd/MM/yyyy')}</span>
                                            {survey.end_date && (
                                                <span>Término: {format(new Date(survey.end_date), 'dd/MM/yyyy')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                                    <Link href={`/admin/enquetes/${survey.id}/editar`}>
                                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                            <Edit className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Editar</span>
                                        </Button>
                                    </Link>
                                    <Link href={`/admin/enquetes/${survey.id}/resultados`}>
                                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                            <BarChart3 className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Resultados</span>
                                        </Button>
                                    </Link>
                                    {survey.status === 'active' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyPublicLink(publicIdentifier)}
                                            className="w-full sm:w-auto"
                                        >
                                            <Copy className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Copiar Link</span>
                                        </Button>
                                    )}
                                    <Link href={`/enquete/${publicIdentifier}`} target="_blank">
                                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                            <Eye className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Visualizar</span>
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline-destructive"
                                        size="sm"
                                        onClick={() => deleteSurvey(survey.id)}
                                        className="col-span-2 sm:col-span-1 sm:ml-auto"
                                    >
                                        <Trash2 className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Excluir</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
