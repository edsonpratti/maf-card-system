'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts'
import {
    BarChart3, Users, Search, RefreshCw, ChevronDown, ChevronUp,
    Calendar, Hash, FileText, TrendingUp, MessageSquare, Activity,
    Filter, CheckSquare, AlignLeft, Scale, ListOrdered,
    Download, FileSpreadsheet, ArrowUpDown
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// ─── Paleta de cores ───────────────────────────────────────────────────────────
const CHART_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface QuestionAnalytic {
    question_id: string
    question_title: string
    question_type: string
    order_index: number
    total_answers: number
    data: any
}

interface RawResponse {
    id: string
    completed_at: string
    answers: Record<string, string>
}

interface SurveyData {
    survey: {
        id: string
        code: string
        name: string
        description?: string
        start_date: string
        end_date?: string
        status: string
        created_at: string
    }
    summary: {
        total_responses: number
        total_questions: number
    }
    question_analytics: QuestionAnalytic[]
    responses_timeline: { date: string; count: number }[]
    raw_responses: RawResponse[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function questionTypeLabel(type: string) {
    const map: Record<string, string> = {
        multiple_choice: 'Múltipla Escolha',
        checkboxes: 'Caixas de Seleção',
        linear_scale: 'Escala Linear',
        short_text: 'Texto Curto',
        long_text: 'Texto Longo',
        name: 'Nome',
        email: 'E-mail',
        phone: 'Telefone',
    }
    return map[type] || type
}

function questionTypeIcon(type: string) {
    if (type === 'multiple_choice') return <ListOrdered className="h-3 w-3" />
    if (type === 'checkboxes') return <CheckSquare className="h-3 w-3" />
    if (type === 'linear_scale') return <Scale className="h-3 w-3" />
    return <AlignLeft className="h-3 w-3" />
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    })
}

// ─── Tooltip customizado ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-gray-800 mb-1">{label || payload[0].payload?.name}</p>
            <p className="text-gray-600">
                {payload[0].value} resposta{payload[0].value !== 1 ? 's' : ''}
                {payload[0].payload?.percentage !== undefined && (
                    <span className="ml-1 text-gray-400">({payload[0].payload.percentage}%)</span>
                )}
            </p>
        </div>
    )
}

// ─── Exportação CSV ───────────────────────────────────────────────────────────
function exportToCSV(surveyName: string, questions: QuestionAnalytic[], rawResponses: RawResponse[]) {
    if (rawResponses.length === 0) return
    const headers = ['#', 'Data/Hora', ...questions.map(q => q.question_title)]
    const rows = rawResponses.map((r, i) => [
        String(i + 1),
        new Date(r.completed_at).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
        }),
        ...questions.map(q => r.answers[q.question_id] || ''),
    ])
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\r\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${surveyName.replace(/[^a-zA-Z0-9]/g, '_')}_respostas.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

// ─── Planilha de respostas ─────────────────────────────────────────────────────
function SpreadsheetView({ questions, responses }: { questions: QuestionAnalytic[]; responses: RawResponse[] }) {
    const [tableSearch, setTableSearch] = useState('')
    const [sortAsc, setSortAsc] = useState(false)
    const [page, setPage] = useState(1)
    const perPage = 20

    const filtered = useMemo(() => {
        let result = [...responses]
        if (tableSearch.trim()) {
            const q = tableSearch.toLowerCase()
            result = result.filter(r =>
                Object.values(r.answers).some(v => v.toLowerCase().includes(q))
            )
        }
        result.sort((a, b) => {
            const ta = new Date(a.completed_at).getTime()
            const tb = new Date(b.completed_at).getTime()
            return sortAsc ? ta - tb : tb - ta
        })
        return result
    }, [responses, tableSearch, sortAsc])

    const totalPages = Math.ceil(filtered.length / perPage)
    const paged = filtered.slice((page - 1) * perPage, page * perPage)

    useEffect(() => { setPage(1) }, [tableSearch, sortAsc])

    if (responses.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400 text-sm">
                Nenhuma resposta registrada ainda.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Controles */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filtrar por qualquer valor..."
                        value={tableSearch}
                        onChange={e => setTableSearch(e.target.value)}
                        className="w-full pl-8 pr-3 h-8 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{filtered.length} de {responses.length} registro{responses.length !== 1 ? 's' : ''}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setSortAsc(a => !a)}
                    >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        {sortAsc ? 'Mais antigas primeiro' : 'Mais recentes primeiro'}
                    </Button>
                </div>
            </div>

            {/* Tabela */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10">
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead className="w-10 text-xs font-semibold text-gray-600 bg-gray-50">#</TableHead>
                                <TableHead className="text-xs font-semibold text-gray-600 min-w-[155px] bg-gray-50 border-r border-gray-200">
                                    Data/Hora
                                </TableHead>
                                {questions.map((q, i) => (
                                    <TableHead key={q.question_id} className="text-xs font-semibold text-gray-600 min-w-[160px] bg-gray-50">
                                        <span className="block truncate max-w-[200px]" title={q.question_title}>
                                            P{i + 1}: {q.question_title}
                                        </span>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paged.map((r, i) => (
                                <TableRow key={r.id} className="hover:bg-indigo-50/30">
                                    <TableCell className="text-xs text-gray-400 font-mono">
                                        {(page - 1) * perPage + i + 1}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600 border-r border-gray-100 whitespace-nowrap">
                                        {new Date(r.completed_at).toLocaleString('pt-BR', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                            timeZone: 'America/Sao_Paulo',
                                        })}
                                    </TableCell>
                                    {questions.map(q => (
                                        <TableCell key={q.question_id} className="text-xs text-gray-700 max-w-[220px]">
                                            <span className="block truncate" title={r.answers[q.question_id] || ''}>
                                                {r.answers[q.question_id] || <span className="text-gray-300">—</span>}
                                            </span>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-gray-400">
                        Página {page} de {totalPages} · {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
                        <span className="flex items-center px-3 text-xs text-gray-600">{page}/{totalPages}</span>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Card de pergunta ──────────────────────────────────────────────────────────
function QuestionCard({ qa, index }: { qa: QuestionAnalytic; index: number }) {
    const [expanded, setExpanded] = useState(true)

    if (!qa.data) return null

    const renderChart = () => {
        switch (qa.data.type) {
            case 'multiple_choice':
            case 'checkboxes': {
                const chartData = qa.data.options.map((opt: any, i: number) => ({
                    name: opt.option.length > 28 ? opt.option.slice(0, 28) + '…' : opt.option,
                    fullName: opt.option,
                    value: opt.count,
                    percentage: opt.percentage,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                }))

                return (
                    <div className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Barras horizontais */}
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
                                    <BarChart3 className="h-3.5 w-3.5" /> Distribuição
                                </p>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={110} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                                            <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={32}>
                                                {chartData.map((entry: any, i: number) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pizza */}
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
                                    <Activity className="h-3.5 w-3.5" /> Proporção
                                </p>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%" cy="50%"
                                                outerRadius={90} innerRadius={48}
                                                paddingAngle={2} dataKey="value"
                                                strokeWidth={0}
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                                    if (!percent || percent < 0.05) return null
                                                    const RADIAN = Math.PI / 180
                                                    const r = innerRadius + (outerRadius - innerRadius) * 1.5
                                                    const x = cx + r * Math.cos(-midAngle * RADIAN)
                                                    const y = cy + r * Math.sin(-midAngle * RADIAN)
                                                    return (
                                                        <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
                                                            {`${(percent * 100).toFixed(0)}%`}
                                                        </text>
                                                    )
                                                }}
                                                labelLine={false}
                                            >
                                                {chartData.map((entry: any, i: number) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Detalhamento */}
                        <div className="border-t pt-5">
                            <p className="text-xs font-medium text-gray-500 mb-3">Detalhamento completo</p>
                            <div className="space-y-2.5">
                                {qa.data.options.map((opt: any, i: number) => (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                <span className="text-sm text-gray-700 truncate" title={opt.option}>{opt.option}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm flex-shrink-0 ml-3">
                                                <span className="text-gray-400">{opt.count} {opt.count === 1 ? 'voto' : 'votos'}</span>
                                                <span className="font-semibold text-gray-700 w-10 text-right">{opt.percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${opt.percentage}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            case 'linear_scale': {
                const scaleData = qa.data.distribution.map((d: any, i: number) => ({
                    value: String(d.value),
                    count: d.count,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                }))
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Média', value: qa.data.average.toFixed(1), color: 'indigo' },
                                { label: 'Mediana', value: qa.data.median, color: 'violet' },
                                { label: 'Respostas', value: qa.total_answers, color: 'emerald' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className={`rounded-xl border p-4 bg-${color}-50 border-${color}-100`}>
                                    <p className={`text-xs font-medium text-${color}-600 mb-1`}>{label}</p>
                                    <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scaleData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="value" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 600, fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <Tooltip content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null
                                        return (
                                            <div className="bg-white border rounded-lg shadow p-2.5 text-sm">
                                                <p className="font-medium text-gray-800">Nota {payload[0].payload.value}</p>
                                                <p className="text-gray-500">{payload[0].value} resposta{Number(payload[0].value) !== 1 ? 's' : ''}</p>
                                            </div>
                                        )
                                    }} cursor={{ fill: '#f9fafb' }} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                                        {scaleData.map((entry: any, i: number) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )
            }

            case 'text': {
                const responses = qa.data.responses || []
                if (responses.length === 0) {
                    return <p className="text-sm text-gray-400 py-4 text-center">Nenhuma resposta de texto ainda.</p>
                }
                return (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {responses.slice(0, 60).map((resp: any, i: number) => (
                            <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed flex-1">{resp.text}</p>
                            </div>
                        ))}
                        {responses.length > 60 && (
                            <div className="text-center py-2">
                                <span className="text-xs text-gray-400">+{responses.length - 60} respostas adicionais não exibidas</span>
                            </div>
                        )}
                    </div>
                )
            }

            default:
                return null
        }
    }

    const typeBadgeColor: Record<string, string> = {
        multiple_choice: 'bg-indigo-100 text-indigo-700',
        checkboxes: 'bg-violet-100 text-violet-700',
        linear_scale: 'bg-emerald-100 text-emerald-700',
        short_text: 'bg-amber-100 text-amber-700',
        long_text: 'bg-amber-100 text-amber-700',
        name: 'bg-sky-100 text-sky-700',
        email: 'bg-sky-100 text-sky-700',
        phone: 'bg-sky-100 text-sky-700',
    }

    return (
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-normal text-gray-500 border-gray-300">
                                Pergunta {index + 1}
                            </Badge>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeColor[qa.question_type] || 'bg-gray-100 text-gray-600'}`}>
                                {questionTypeIcon(qa.question_type)}
                                {questionTypeLabel(qa.question_type)}
                            </span>
                        </div>
                        <CardTitle className="text-base leading-snug text-gray-800">{qa.question_title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-indigo-600">{qa.total_answers}</p>
                            <p className="text-xs text-gray-400">respostas</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => setExpanded(e => !e)}>
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {expanded && (
                <CardContent className="pt-6">
                    {qa.total_answers === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">Ainda não há respostas para esta pergunta.</p>
                    ) : renderChart()}
                </CardContent>
            )}
        </Card>
    )
}

// ─── Seção de uma enquete ──────────────────────────────────────────────────────
function SurveySection({ data, filterType }: { data: SurveyData; filterType: string }) {
    const [collapsed, setCollapsed] = useState(false)
    const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts')

    const filteredQuestions = useMemo(() => {
        if (filterType === 'all') return data.question_analytics
        if (filterType === 'choice') {
            return data.question_analytics.filter(q =>
                q.question_type === 'multiple_choice' || q.question_type === 'checkboxes'
            )
        }
        if (filterType === 'scale') {
            return data.question_analytics.filter(q => q.question_type === 'linear_scale')
        }
        if (filterType === 'text') {
            return data.question_analytics.filter(q =>
                ['short_text', 'long_text', 'name', 'email', 'phone'].includes(q.question_type)
            )
        }
        return data.question_analytics
    }, [data.question_analytics, filterType])

    const timelineData = data.responses_timeline.map(d => ({
        date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        respostas: d.count,
    }))

    const handleExport = () => exportToCSV(data.survey.name, data.question_analytics, data.raw_responses || [])

    return (
        <div className="space-y-5">
            {/* Header da enquete */}
            <div className="flex items-start justify-between gap-3">
                {/* Info — clicável para recolher */}
                <div
                    className="flex-1 min-w-0 cursor-pointer select-none"
                    onClick={() => setCollapsed(c => !c)}
                >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Ativa</Badge>
                        <span className="text-xs text-gray-400 font-mono">{data.survey.code}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Desde {formatDate(data.survey.start_date)}
                            {data.survey.end_date && ` até ${formatDate(data.survey.end_date)}`}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{data.survey.name}</h2>
                    {data.survey.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{data.survey.description}</p>
                    )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {!collapsed && (
                        <>
                            {/* Alternador de visualização — desktop */}
                            <div className="hidden sm:flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                                <button
                                    onClick={() => setViewMode('charts')}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        viewMode === 'charts'
                                            ? 'bg-white text-gray-800 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <BarChart3 className="h-3.5 w-3.5" />
                                    Gráficos
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        viewMode === 'table'
                                            ? 'bg-white text-gray-800 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                    Planilha
                                </button>
                            </div>
                            {/* Exportar CSV */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                onClick={handleExport}
                                disabled={!(data.raw_responses?.length)}
                                title="Exportar respostas desta enquete em CSV"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Exportar CSV</span>
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        onClick={() => setCollapsed(c => !c)}
                    >
                        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {!collapsed && (
                <>
                    {/* Alternador mobile */}
                    <div className="flex sm:hidden bg-gray-100 rounded-lg p-0.5 gap-0.5 w-fit">
                        <button
                            onClick={() => setViewMode('charts')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                viewMode === 'charts'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Gráficos
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                viewMode === 'table'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Planilha
                        </button>
                    </div>

                    {viewMode === 'table' ? (
                        /* ── Modo planilha ── */
                        <Card className="border border-gray-200 shadow-sm overflow-hidden">
                            <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/60">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-indigo-500" />
                                        Respostas individuais
                                        <span className="text-gray-400 font-normal">
                                            · {data.raw_responses?.length || 0} registro{(data.raw_responses?.length || 0) !== 1 ? 's' : ''}
                                        </span>
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="sm:hidden h-7 text-xs gap-1 text-indigo-600"
                                        onClick={handleExport}
                                        disabled={!(data.raw_responses?.length)}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        CSV
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <SpreadsheetView
                                    questions={data.question_analytics}
                                    responses={data.raw_responses || []}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        /* ── Modo gráficos ── */
                        <>
                            {/* Cards de resumo */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Card className="border border-gray-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                <Users className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Total de Respostas</p>
                                                <p className="text-2xl font-bold text-gray-800">{data.summary.total_responses}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border border-gray-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                                                <Hash className="h-4 w-4 text-violet-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Perguntas</p>
                                                <p className="text-2xl font-bold text-gray-800">{data.summary.total_questions}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border border-gray-200 col-span-2 md:col-span-1">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Dias com Respostas</p>
                                                <p className="text-2xl font-bold text-gray-800">{data.responses_timeline.length}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Timeline de respostas */}
                            {timelineData.length > 1 && (
                                <Card className="border border-gray-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                            <Activity className="h-4 w-4" />
                                            Respostas ao longo do tempo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-36">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={timelineData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id={`gradient-${data.survey.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} width={28} />
                                                    <Tooltip content={({ active, payload }) => {
                                                        if (!active || !payload?.length) return null
                                                        return (
                                                            <div className="bg-white border rounded-lg shadow p-2 text-xs">
                                                                <p className="font-semibold text-gray-800">{payload[0].payload.date}</p>
                                                                <p className="text-gray-500">{payload[0].value} resposta{payload[0].value !== 1 ? 's' : ''}</p>
                                                            </div>
                                                        )
                                                    }} />
                                                    <Area type="monotone" dataKey="respostas" stroke="#6366f1" strokeWidth={2} fill={`url(#gradient-${data.survey.id})`} dot={false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Perguntas */}
                            {filteredQuestions.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    Nenhuma pergunta corresponde ao filtro selecionado.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredQuestions.map((qa, i) => (
                                        <QuestionCard
                                            key={qa.question_id}
                                            qa={qa}
                                            index={data.question_analytics.findIndex(q => q.question_id === qa.question_id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function ResultadosEnquetesPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [allSurveys, setAllSurveys] = useState<SurveyData[]>([])
    const [search, setSearch] = useState('')
    const [selectedSurvey, setSelectedSurvey] = useState<string>('all')
    const [filterType, setFilterType] = useState<string>('all')
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch('/api/public/surveys/dashboard', { cache: 'no-store' })
            if (!res.ok) throw new Error('Erro ao carregar dados')
            const json = await res.json()
            setAllSurveys(json.surveys || [])
            setLastRefresh(new Date())
        } catch (e: any) {
            setError(e.message || 'Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // Filtros
    const visibleSurveys = useMemo(() => {
        let result = allSurveys
        if (selectedSurvey !== 'all') {
            result = result.filter(s => s.survey.id === selectedSurvey)
        }
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(s =>
                s.survey.name.toLowerCase().includes(q) ||
                s.survey.code.toLowerCase().includes(q) ||
                (s.survey.description || '').toLowerCase().includes(q)
            )
        }
        return result
    }, [allSurveys, selectedSurvey, search])

    // Totais globais
    const totalResponses = allSurveys.reduce((s, d) => s + d.summary.total_responses, 0)
    const totalQuestions = allSurveys.reduce((s, d) => s + d.summary.total_questions, 0)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Cabeçalho ── */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                <BarChart3 className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-gray-900 leading-none">MAF Pro Quiz</h1>
                                <p className="text-xs text-gray-500 leading-none mt-0.5">Dashboard de Resultados</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 hidden sm:block">
                                Atualizado {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!loading && !error && visibleSurveys.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs gap-1.5"
                                    onClick={() => {
                                        visibleSurveys.forEach((s, idx) => {
                                            setTimeout(() => {
                                                exportToCSV(s.survey.name, s.question_analytics, s.raw_responses || [])
                                            }, idx * 400)
                                        })
                                    }}
                                    title="Exportar todas as enquetes visíveis em CSV"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Exportar tudo</span>
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchData}
                                disabled={loading}
                                className="text-xs gap-1.5"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Atualizar</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* ── KPIs globais ── */}
                {!loading && !error && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Enquetes Ativas</p>
                                        <p className="text-3xl font-bold text-gray-900">{allSurveys.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total de Respostas</p>
                                        <p className="text-3xl font-bold text-gray-900">{totalResponses}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-gray-200 shadow-sm col-span-2 md:col-span-1">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <MessageSquare className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total de Perguntas</p>
                                        <p className="text-3xl font-bold text-gray-900">{totalQuestions}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── Filtros ── */}
                {!loading && !error && allSurveys.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Filtros</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Busca */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar enquete por nome ou código..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 bg-gray-50 border-gray-200 text-sm"
                                />
                            </div>

                            {/* Seletor de enquete */}
                            {allSurveys.length > 1 && (
                                <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                                    <SelectTrigger className="w-full sm:w-64 bg-gray-50 border-gray-200 text-sm">
                                        <SelectValue placeholder="Todas as enquetes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as enquetes</SelectItem>
                                        {allSurveys.map(s => (
                                            <SelectItem key={s.survey.id} value={s.survey.id}>
                                                {s.survey.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Tipo de pergunta */}
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-full sm:w-52 bg-gray-50 border-gray-200 text-sm">
                                    <SelectValue placeholder="Tipo de pergunta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os tipos</SelectItem>
                                    <SelectItem value="choice">Escolha (múltipla / caixas)</SelectItem>
                                    <SelectItem value="scale">Escala linear</SelectItem>
                                    <SelectItem value="text">Texto livre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* ── Estados de carregamento/erro/vazio ── */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
                        <p className="text-gray-500 text-sm">Carregando resultados das enquetes...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                            <BarChart3 className="h-7 w-7 text-red-400" />
                        </div>
                        <p className="text-gray-700 font-medium">{error}</p>
                        <Button variant="outline" size="sm" onClick={fetchData}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
                        </Button>
                    </div>
                )}

                {!loading && !error && allSurveys.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileText className="h-7 w-7 text-gray-400" />
                        </div>
                        <p className="text-gray-700 font-medium">Nenhuma enquete ativa no momento</p>
                        <p className="text-gray-400 text-sm">Os resultados aparecerão aqui assim que uma enquete for ativada.</p>
                    </div>
                )}

                {!loading && !error && allSurveys.length > 0 && visibleSurveys.length === 0 && (
                    <div className="text-center py-16 text-gray-400 text-sm">
                        Nenhuma enquete corresponde aos filtros aplicados.
                    </div>
                )}

                {/* ── Lista de enquetes ── */}
                {!loading && !error && visibleSurveys.length > 0 && (
                    <div className="space-y-12">
                        {visibleSurveys.map((data, idx) => (
                            <div key={data.survey.id}>
                                {idx > 0 && <div className="border-t border-gray-200" />}
                                <div className={idx > 0 ? 'pt-10' : ''}>
                                    <SurveySection data={data} filterType={filterType} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Rodapé ── */}
                <div className="text-center py-8 border-t border-gray-200 mt-8">
                    <p className="text-xs text-gray-400">
                        MAF Pro Quiz · Dashboard de Resultados Internos · Somente enquetes ativas são exibidas
                    </p>
                </div>
            </div>
        </div>
    )
}
