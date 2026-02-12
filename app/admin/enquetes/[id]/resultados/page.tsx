'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, RefreshCw } from 'lucide-react'
import { Survey, QuestionAnalytics } from '@/lib/types/survey-types'
import { toast } from 'sonner'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function SurveyResultsPage({ params }: { params: { id: string } }) {
    const [loading, setLoading] = useState(true)
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [analytics, setAnalytics] = useState<any>(null)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        loadSurvey()
        loadAnalytics()
    }, [params.id])

    const loadSurvey = async () => {
        try {
            const response = await fetch(`/api/admin/surveys/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setSurvey(data)
            }
        } catch (error) {
            console.error('Error loading survey:', error)
        }
    }

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/surveys/${params.id}/analytics`)
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

    const handleExport = async () => {
        try {
            setExporting(true)
            const response = await fetch(`/api/admin/surveys/${params.id}/export`)
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

    const renderQuestionAnalytics = (qa: QuestionAnalytics) => {
        if (!qa.data) return null

        switch (qa.data.type) {
            case 'multiple_choice':
            case 'checkboxes':
                const chartData = qa.data.options.map((opt: any) => ({
                    name: opt.option,
                    value: opt.count,
                    percentage: opt.percentage
                }))

                return (
                    <Card key={qa.question_id}>
                        <CardHeader>
                            <CardTitle className="text-lg">{qa.question_title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{qa.total_answers} respostas</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(1)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {chartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {qa.data.options.map((opt: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span>{opt.option}</span>
                                        <span className="font-medium">{opt.count} ({opt.percentage}%)</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )

            case 'linear_scale':
                const scaleData = qa.data.distribution.map((d: any) => ({
                    value: d.value.toString(),
                    count: d.count
                }))

                return (
                    <Card key={qa.question_id}>
                        <CardHeader>
                            <CardTitle className="text-lg">{qa.question_title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{qa.total_answers} respostas</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-sm text-muted-foreground">Média</p>
                                        <p className="text-3xl font-bold">{qa.data.average.toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-sm text-muted-foreground">Mediana</p>
                                        <p className="text-3xl font-bold">{qa.data.median}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-sm text-muted-foreground">Total</p>
                                        <p className="text-3xl font-bold">{qa.total_answers}</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={scaleData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="value" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )

            case 'text':
                return (
                    <Card key={qa.question_id}>
                        <CardHeader>
                            <CardTitle className="text-lg">{qa.question_title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{qa.total_answers} respostas</p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {qa.data.responses.slice(0, 50).map((resp: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm">{resp.text}</p>
                                    </div>
                                ))}
                                {qa.data.responses.length > 50 && (
                                    <p className="text-sm text-muted-foreground text-center">
                                        +{qa.data.responses.length - 50} respostas adicionais (exporte para ver todas)
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )

            default:
                return null
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Carregando resultados...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
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

            {/* Question Analytics */}
            {analytics?.question_analytics && analytics.question_analytics.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Análise por Pergunta</h2>
                    {analytics.question_analytics.map((qa: QuestionAnalytics) => renderQuestionAnalytics(qa))}
                </div>
            )}
        </div>
    )
}
