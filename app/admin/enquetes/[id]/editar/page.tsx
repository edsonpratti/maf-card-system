'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Save, Eye } from 'lucide-react'
import { Survey, SurveyQuestion, SurveyStatus } from '@/lib/types/survey-types'
import { toast } from 'sonner'
import QuestionBuilder from '@/components/admin/question-builder'
import QuestionForm from '@/components/admin/question-form'
import { canPublishSurvey } from '@/lib/utils/survey-utils'

export default function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [surveyId, setSurveyId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [questions, setQuestions] = useState<SurveyQuestion[]>([])
    const [showQuestionForm, setShowQuestionForm] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | undefined>()

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
            loadQuestions()
        }
    }, [surveyId])

    const loadSurvey = async () => {
        if (!surveyId) return

        try {
            const response = await fetch(`/api/admin/surveys/${surveyId}`)
            if (response.ok) {
                const data = await response.json()
                setSurvey(data)
            } else {
                toast.error('Enquete não encontrada')
                router.push('/admin/enquetes')
            }
        } catch (error) {
            console.error('Error loading survey:', error)
            toast.error('Erro ao carregar enquete')
        } finally {
            setLoading(false)
        }
    }

    const loadQuestions = async () => {
        if (!surveyId) return

        try {
            const response = await fetch(`/api/admin/surveys/${surveyId}/questions`)
            if (response.ok) {
                const data = await response.json()
                setQuestions(data)
            }
        } catch (error) {
            console.error('Error loading questions:', error)
        }
    }

    const handleSaveSurvey = async () => {
        if (!survey || !surveyId) return

        try {
            setSaving(true)
            const response = await fetch(`/api/admin/surveys/${surveyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: survey.name,
                    description: survey.description,
                    start_date: survey.start_date,
                    end_date: survey.end_date,
                    status: survey.status
                })
            })

            if (response.ok) {
                toast.success('Enquete salva com sucesso!')
            } else {
                toast.error('Erro ao salvar enquete')
            }
        } catch (error) {
            console.error('Error saving survey:', error)
            toast.error('Erro ao salvar enquete')
        } finally {
            setSaving(false)
        }
    }

    const handlePublish = async () => {
        if (!survey || !surveyId) return

        const validation = canPublishSurvey(survey, questions)
        if (!validation.valid) {
            toast.error(validation.errors[0])
            return
        }

        try {
            setSaving(true)
            const response = await fetch(`/api/admin/surveys/${surveyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
            })

            if (response.ok) {
                const updated = await response.json()
                setSurvey(updated)
                toast.success('Enquete publicada com sucesso!')
            } else {
                toast.error('Erro ao publicar enquete')
            }
        } catch (error) {
            console.error('Error publishing survey:', error)
            toast.error('Erro ao publicar enquete')
        } finally {
            setSaving(false)
        }
    }

    const handleQuestionSaved = (question: SurveyQuestion) => {
        loadQuestions()
        setShowQuestionForm(false)
        setEditingQuestion(undefined)
    }

    const handleEditQuestion = (question: SurveyQuestion) => {
        setEditingQuestion(question)
        setShowQuestionForm(true)
    }

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return
        if (!surveyId) return

        try {
            const response = await fetch(`/api/admin/surveys/${surveyId}/questions/${questionId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success('Pergunta excluída')
                loadQuestions()
            } else {
                toast.error('Erro ao excluir pergunta')
            }
        } catch (error) {
            console.error('Error deleting question:', error)
            toast.error('Erro ao excluir pergunta')
        }
    }

    const handleDuplicateQuestion = async (question: SurveyQuestion) => {
        if (!surveyId) return

        try {
            const response = await fetch(`/api/admin/surveys/${surveyId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${question.title} (cópia)`,
                    subtitle: question.subtitle,
                    question_type: question.question_type,
                    is_required: question.is_required,
                    settings: question.settings
                })
            })

            if (response.ok) {
                toast.success('Pergunta duplicada')
                loadQuestions()
            } else {
                toast.error('Erro ao duplicar pergunta')
            }
        } catch (error) {
            console.error('Error duplicating question:', error)
            toast.error('Erro ao duplicar pergunta')
        }
    }

    const handleReorderQuestions = async (reorderedQuestions: SurveyQuestion[]) => {
        if (!surveyId) return

        setQuestions(reorderedQuestions)

        try {
            const response = await fetch(`/api/admin/surveys/${surveyId}/questions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: reorderedQuestions.map(q => ({
                        id: q.id,
                        order_index: q.order_index
                    }))
                })
            })

            if (!response.ok) {
                toast.error('Erro ao reordenar perguntas')
                loadQuestions() // Reload to get correct order
            }
        } catch (error) {
            console.error('Error reordering questions:', error)
            toast.error('Erro ao reordenar perguntas')
            loadQuestions()
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        )
    }

    if (!survey) {
        return null
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/enquetes">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{survey.name}</h1>
                        <p className="text-muted-foreground mt-1">
                            Código: <code className="bg-muted px-2 py-0.5 rounded">{survey.code}</code>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/enquete/${survey.code}`} target="_blank">
                        <Button variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                        </Button>
                    </Link>
                    <Button onClick={handleSaveSurvey} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                    </Button>
                    {survey.status === 'draft' && (
                        <Button onClick={handlePublish} disabled={saving}>
                            Publicar
                        </Button>
                    )}
                </div>
            </div>

            {/* Survey Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Configurações da Enquete</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={survey.name}
                                onChange={(e) => setSurvey({ ...survey, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={survey.status}
                                onValueChange={(value: string) => setSurvey({ ...survey, status: value as SurveyStatus })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Rascunho</SelectItem>
                                    <SelectItem value="active">Ativa</SelectItem>
                                    <SelectItem value="closed">Encerrada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="description"
                            value={survey.description || ''}
                            onChange={(e) => setSurvey({ ...survey, description: e.target.value })}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Data de Início</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={survey.start_date.split('T')[0]}
                                onChange={(e) => setSurvey({ ...survey, start_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">Data de Término</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={survey.end_date?.split('T')[0] || ''}
                                onChange={(e) => setSurvey({ ...survey, end_date: e.target.value || undefined })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Questions Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Perguntas ({questions.length})</h2>
                    {!showQuestionForm && (
                        <Button onClick={() => {
                            setEditingQuestion(undefined)
                            setShowQuestionForm(true)
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Pergunta
                        </Button>
                    )}
                </div>

                {showQuestionForm ? (
                    <QuestionForm
                        surveyId={surveyId || ''}
                        question={editingQuestion}
                        onSave={handleQuestionSaved}
                        onCancel={() => {
                            setShowQuestionForm(false)
                            setEditingQuestion(undefined)
                        }}
                    />
                ) : (
                    <QuestionBuilder
                        questions={questions}
                        onEdit={handleEditQuestion}
                        onDelete={handleDeleteQuestion}
                        onDuplicate={handleDuplicateQuestion}
                        onReorder={handleReorderQuestions}
                    />
                )}
            </div>
        </div>
    )
}
