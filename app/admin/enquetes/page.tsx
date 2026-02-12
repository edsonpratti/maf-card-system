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
        const variants: Record<SurveyStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            draft: { label: 'Rascunho', variant: 'secondary' },
            active: { label: 'Ativa', variant: 'default' },
            closed: { label: 'Encerrada', variant: 'outline' }
        }
        const config = variants[status]
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const filteredSurveys = filter === 'all'
        ? surveys
        : surveys.filter(s => s.status === filter)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Enquetes</h1>
                    <p className="text-muted-foreground mt-1">
                        Crie e gerencie enquetes e questionários para seu público
                    </p>
                </div>
                <Link href="/admin/enquetes/nova">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Enquete
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
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
                    {filteredSurveys.map(survey => (
                        <Card key={survey.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <CardTitle>{survey.name}</CardTitle>
                                            {getStatusBadge(survey.status)}
                                        </div>
                                        {survey.description && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {survey.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                            <span>Código: <code className="bg-muted px-2 py-0.5 rounded">{survey.code}</code></span>
                                            <span>Início: {format(new Date(survey.start_date), 'dd/MM/yyyy')}</span>
                                            {survey.end_date && (
                                                <span>Término: {format(new Date(survey.end_date), 'dd/MM/yyyy')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Link href={`/admin/enquetes/${survey.id}/editar`}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                        </Button>
                                    </Link>
                                    <Link href={`/admin/enquetes/${survey.id}/resultados`}>
                                        <Button variant="outline" size="sm">
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            Resultados
                                        </Button>
                                    </Link>
                                    {survey.status === 'active' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyPublicLink(survey.code)}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copiar Link
                                        </Button>
                                    )}
                                    <Link href={`/enquete/${survey.code}`} target="_blank">
                                        <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            Visualizar
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteSurvey(survey.id)}
                                        className="ml-auto text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
