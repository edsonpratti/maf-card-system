'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, RefreshCw, BarChart3, Users, Sparkles, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Survey, QuestionAnalytics } from '@/lib/types/survey-types'
import { toast } from 'sonner'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'

// Paleta de cores moderna e harmônica
const CHART_COLORS = [
    '#6366f1', // indigo
    '#8b5cf6', // violet  
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#3b82f6', // blue
];

// Gradientes para gráficos
const GRADIENTS = {
    primary: ['#6366f1', '#8b5cf6'],
    success: ['#22c55e', '#14b8a6'],
    warning: ['#f97316', '#eab308'],
};

interface ResponseData {
    id: string
    sessionId: string
    startedAt: string
    completedAt: string
    answers: Record<string, any>
}

interface QuestionData {
    id: string
    title: string
    question_type: string
    order_index: number
    settings: any
}

export default function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const [surveyId, setSurveyId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [analytics, setAnalytics] = useState<any>(null)
    const [exporting, setExporting] = useState(false)
    const [activeTab, setActiveTab] = useState('analysis')
    const [responsesData, setResponsesData] = useState<{ questions: QuestionData[], responses: ResponseData[] } | null>(null)
    const [loadingResponses, setLoadingResponses] = useState(false)
    const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null)
    const [responsesPage, setResponsesPage] = useState(1)
    const responsesPerPage = 10

    useEffect(() => {
        const initializePage = async () => {
            const { id } = await params
            setSurveyId(id)
        }
        initializePage()
    }, [params])

    useEffect(() => {
        if (surveyId) {
            loadSurvey()
            loadAnalytics()
        }
    }, [surveyId])

    // Load responses when switching to responses tab
    useEffect(() => {
        if (activeTab === 'responses' && surveyId && !responsesData) {
            loadResponses()
        }
    }, [activeTab, surveyId])

    const loadSurvey = async () => {
        if (!surveyId) return

        try {
            const response = await fetch(`/api/admin/surveys/${surveyId}`)
            if (response.ok) {
                const data = await response.json()
                setSurvey(data)
            }
        } catch (error) {
            console.error('Error loading survey:', error)
        }
    }

    const loadAnalytics = async () => {
        if (!surveyId) return

        try {
            setLoading(true)
            const response = await fetch(`/api/admin/surveys/${surveyId}/analytics`)
            if (response.ok) {
                const data = await response.json()
                setAnalytics(data)
            } else {
                toast.error('Erro ao carregar analytics')
            }
        } catch (error) {
            console.error('Error loading analytics:', error)
            toast.error('Erro ao carregar analytics')
        } finally {
            setLoading(false)
        }
    }

    const loadResponses = async () => {
        if (!surveyId) return

        try {
            setLoadingResponses(true)
            const response = await fetch(`/api/admin/surveys/${surveyId}/responses`)
            if (response.ok) {
                const data = await response.json()
                setResponsesData(data)
            } else {
                toast.error('Erro ao carregar respostas')
            }
        } catch (error) {
            console.error('Error loading responses:', error)
            toast.error('Erro ao carregar respostas')
        } finally {
            setLoadingResponses(false)
        }
    }

    const handleDeleteResponse = async (responseId: string) => {
        if (!surveyId) return
        if (!confirm('Tem certeza que deseja excluir esta resposta? Esta ação não pode ser desfeita.')) return

        try {
            setDeletingResponseId(responseId)
            const response = await fetch(`/api/admin/surveys/${surveyId}/responses?responseId=${responseId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success('Resposta excluída com sucesso')
                // Remove from local state
                if (responsesData) {
                    setResponsesData({
                        ...responsesData,
                        responses: responsesData.responses.filter(r => r.id !== responseId)
                    })
                }
                // Reload analytics to update counts
                loadAnalytics()
            } else {
                const error = await response.json()
                toast.error(error.error || 'Erro ao excluir resposta')
            }
        } catch (error) {
            console.error('Error deleting response:', error)
            toast.error('Erro ao excluir resposta')
        } finally {
            setDeletingResponseId(null)
        }
    }

    const handleExport = async () => {
        if (!surveyId) return

        try {
            setExporting(true)
            const response = await fetch(`/api/admin/surveys/${surveyId}/export`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${survey?.name || 'enquete'}_respostas.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success('Dados exportados com sucesso!')
            } else {
                toast.error('Erro ao exportar dados')
            }
        } catch (error) {
            console.error('Error exporting:', error)
            toast.error('Erro ao exportar dados')
        } finally {
            setExporting(false)
        }
    }

    const renderQuestionAnalytics = (qa: QuestionAnalytics, questionIndex: number) => {
        if (!qa.data) return null

        // Custom tooltip component
        const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-medium text-sm">{label || payload[0].payload.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {payload[0].value} resposta{payload[0].value !== 1 ? 's' : ''}
                            {payload[0].payload.percentage !== undefined && (
                                <span className="ml-1">({payload[0].payload.percentage}%)</span>
                            )}
                        </p>
                    </div>
                )
            }
            return null
        }

        // Custom label for pie chart
        const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
            const RADIAN = Math.PI / 180
            const radius = innerRadius + (outerRadius - innerRadius) * 1.4
            const x = cx + radius * Math.cos(-midAngle * RADIAN)
            const y = cy + radius * Math.sin(-midAngle * RADIAN)

            if (percent < 0.05) return null // Don't show labels for tiny slices

            return (
                <text
                    x={x}
                    y={y}
                    fill="currentColor"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    className="text-xs fill-foreground"
                >
                    {`${(percent * 100).toFixed(0)}%`}
                </text>
            )
        }

        switch (qa.data.type) {
            case 'multiple_choice':
            case 'checkboxes':
                const chartData = qa.data.options.map((opt: any, idx: number) => ({
                    name: opt.option.length > 25 ? opt.option.substring(0, 25) + '...' : opt.option,
                    fullName: opt.option,
                    value: opt.count,
                    percentage: opt.percentage,
                    fill: CHART_COLORS[idx % CHART_COLORS.length]
                }))

                const maxValue = Math.max(...chartData.map((d: any) => d.value), 1)

                return (
                    <Card key={qa.question_id} className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs font-normal">
                                            Pergunta {questionIndex + 1}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                            {qa.data.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Caixas de Seleção'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg leading-tight">{qa.question_title}</CardTitle>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">{qa.total_answers}</p>
                                    <p className="text-xs text-muted-foreground">respostas</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Bar Chart Section */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        Distribuição de Respostas
                                    </h4>
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                data={chartData} 
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                                <YAxis 
                                                    type="category" 
                                                    dataKey="name" 
                                                    axisLine={false} 
                                                    tickLine={false}
                                                    tick={{ fontSize: 12 }}
                                                    width={100}
                                                />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                                <Bar 
                                                    dataKey="value" 
                                                    radius={[0, 6, 6, 0]}
                                                    maxBarSize={35}
                                                >
                                                    {chartData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Pie Chart Section */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 2a10 10 0 0 1 10 10" />
                                        </svg>
                                        Proporção
                                    </h4>
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={renderCustomizedLabel}
                                                    outerRadius={90}
                                                    innerRadius={50}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    strokeWidth={0}
                                                >
                                                    {chartData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Legend / Detail List */}
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="text-sm font-medium text-muted-foreground mb-4">Detalhamento</h4>
                                <div className="space-y-3">
                                    {qa.data.options.map((opt: any, idx: number) => {
                                        const percentage = Number(opt.percentage) || 0
                                        return (
                                            <div key={idx} className="group">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            className="w-3 h-3 rounded-full flex-shrink-0" 
                                                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                                        />
                                                        <span className="text-sm truncate max-w-[300px]" title={opt.option}>
                                                            {opt.option}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className="text-muted-foreground">{opt.count} voto{opt.count !== 1 ? 's' : ''}</span>
                                                        <span className="font-semibold w-12 text-right">{percentage}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                                        style={{ 
                                                            width: `${percentage}%`,
                                                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )

            case 'linear_scale':
                const scaleData = qa.data.distribution.map((d: any, idx: number) => ({
                    value: d.value.toString(),
                    count: d.count,
                    fill: CHART_COLORS[idx % CHART_COLORS.length]
                }))

                const avgPercentage = ((qa.data.average - 1) / 4) * 100 // Assuming 1-5 scale

                return (
                    <Card key={qa.question_id} className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-transparent pb-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs font-normal">
                                            Pergunta {questionIndex + 1}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                            Escala Linear
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg leading-tight">{qa.question_title}</CardTitle>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-emerald-600">{qa.total_answers}</p>
                                    <p className="text-xs text-muted-foreground">respostas</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950 dark:to-indigo-900/50 p-4">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full -mr-8 -mt-8" />
                                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Média</p>
                                    <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{qa.data.average.toFixed(1)}</p>
                                </div>
                                <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950 dark:to-violet-900/50 p-4">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-full -mr-8 -mt-8" />
                                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">Mediana</p>
                                    <p className="text-3xl font-bold text-violet-700 dark:text-violet-300">{qa.data.median}</p>
                                </div>
                                <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50 p-4">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total</p>
                                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{qa.total_answers}</p>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={scaleData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis 
                                            dataKey="value" 
                                            axisLine={false} 
                                            tickLine={false}
                                            tick={{ fontSize: 14, fontWeight: 500 }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-popover border rounded-lg shadow-lg p-3">
                                                            <p className="font-medium text-sm">Nota {payload[0].payload.value}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {payload[0].value} resposta{Number(payload[0].value) !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                        />
                                        <Bar 
                                            dataKey="count" 
                                            radius={[8, 8, 0, 0]}
                                            maxBarSize={60}
                                        >
                                            {scaleData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )

            case 'text':
                return (
                    <Card key={qa.question_id} className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent pb-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs font-normal">
                                            Pergunta {questionIndex + 1}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                            Texto Livre
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg leading-tight">{qa.question_title}</CardTitle>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-amber-600">{qa.total_answers}</p>
                                    <p className="text-xs text-muted-foreground">respostas</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {qa.data.responses.slice(0, 50).map((resp: any, idx: number) => (
                                    <div 
                                        key={idx} 
                                        className="p-4 bg-muted/50 rounded-xl border border-border/50 hover:border-border transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {idx + 1}
                                            </div>
                                            <p className="text-sm leading-relaxed flex-1">{resp.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {qa.data.responses.length > 50 && (
                                    <div className="text-center py-4">
                                        <Badge variant="outline" className="text-muted-foreground">
                                            +{qa.data.responses.length - 50} respostas adicionais
                                        </Badge>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Exporte os dados para ver todas as respostas
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )

            default:
                return null
        }
    }

    // Pagination helpers for responses
    const paginatedResponses = responsesData?.responses.slice(
        (responsesPage - 1) * responsesPerPage,
        responsesPage * responsesPerPage
    ) || []
    const totalPages = Math.ceil((responsesData?.responses.length || 0) / responsesPerPage)

    // Render responses table
    const renderResponsesTable = () => {
        if (loadingResponses) {
            return (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        Carregando respostas...
                    </CardContent>
                </Card>
            )
        }

        if (!responsesData || responsesData.responses.length === 0) {
            return (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        Nenhuma resposta encontrada.
                    </CardContent>
                </Card>
            )
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Relação de Respostas</CardTitle>
                    <CardDescription>
                        {responsesData.responses.length} resposta{responsesData.responses.length !== 1 ? 's' : ''} coletada{responsesData.responses.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[80px]">#</TableHead>
                                    <TableHead className="min-w-[150px]">Data</TableHead>
                                    {responsesData.questions.map((q, i) => (
                                        <TableHead key={q.id} className="min-w-[200px]">
                                            <span className="font-medium">P{i + 1}:</span>{' '}
                                            {q.title.length > 40 ? q.title.substring(0, 40) + '...' : q.title}
                                        </TableHead>
                                    ))}
                                    <TableHead className="min-w-[80px] text-center">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedResponses.map((response, idx) => (
                                    <TableRow key={response.id}>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {(responsesPage - 1) * responsesPerPage + idx + 1}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(response.completedAt).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        {responsesData.questions.map(q => (
                                            <TableCell key={q.id} className="text-sm">
                                                {response.answers[q.id] || '-'}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteResponse(response.id)}
                                                disabled={deletingResponseId === response.id}
                                                title="Excluir resposta"
                                            >
                                                {deletingResponseId === response.id ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {(responsesPage - 1) * responsesPerPage + 1} a{' '}
                                {Math.min(responsesPage * responsesPerPage, responsesData.responses.length)} de{' '}
                                {responsesData.responses.length} respostas
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResponsesPage(p => Math.max(1, p - 1))}
                                    disabled={responsesPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="flex items-center px-3 text-sm">
                                    {responsesPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResponsesPage(p => Math.min(totalPages, p + 1))}
                                    disabled={responsesPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // Render AI Analysis placeholder
    const renderAIAnalysis = () => {
        return (
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>Análise por IA</CardTitle>
                    <CardDescription>
                        Recurso em desenvolvimento
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <Badge variant="secondary" className="text-sm">
                        Em implantação
                    </Badge>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Em breve você poderá utilizar inteligência artificial para obter 
                        insights automáticos sobre as respostas da sua enquete, incluindo 
                        análise de sentimento, padrões de comportamento e recomendações.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
                        <div className="p-4 rounded-lg border bg-muted/50">
                            <p className="font-medium text-sm">Análise de Sentimento</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Identifique o tom das respostas
                            </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-muted/50">
                            <p className="font-medium text-sm">Padrões de Comportamento</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Descubra tendências nos dados
                            </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-muted/50">
                            <p className="font-medium text-sm">Recomendações</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sugestões baseadas em IA
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Carregando resultados...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/enquetes">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Resultados: {survey?.name}</h1>
                        <p className="text-muted-foreground mt-1">
                            Análise em tempo real das respostas
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadAnalytics}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                    <Button onClick={handleExport} disabled={exporting || !analytics?.total_responses}>
                        <Download className="h-4 w-4 mr-2" />
                        {exporting ? 'Exportando...' : 'Exportar CSV'}
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total de Respostas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{analytics?.summary?.total_responses || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Respostas Completas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{analytics?.summary?.completed_responses || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Taxa de Conclusão
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{analytics?.summary?.completion_rate || 0}%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Perguntas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{analytics?.question_analytics?.length || 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* No responses message */}
            {analytics?.total_responses === 0 && (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        Nenhuma resposta recebida ainda. Compartilhe o link da enquete para começar a coletar dados!
                    </CardContent>
                </Card>
            )}

            {/* Tabs for different views */}
            {analytics?.total_responses > 0 && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="analysis" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            <span className="hidden sm:inline">Análise por Pergunta</span>
                            <span className="sm:hidden">Análise</span>
                        </TabsTrigger>
                        <TabsTrigger value="responses" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span className="hidden sm:inline">Relação de Respostas</span>
                            <span className="sm:hidden">Respostas</span>
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline">Análise por IA</span>
                            <span className="sm:hidden">IA</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="analysis" className="mt-6">
                        {analytics?.question_analytics && analytics.question_analytics.length > 0 && (
                            <div className="space-y-6">
                                {analytics.question_analytics.map((qa: QuestionAnalytics, index: number) => renderQuestionAnalytics(qa, index))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="responses" className="mt-6">
                        {renderResponsesTable()}
                    </TabsContent>

                    <TabsContent value="ai" className="mt-6">
                        {renderAIAnalysis()}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}
