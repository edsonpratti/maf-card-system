'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Survey, SurveyQuestion, AnswerValue } from '@/lib/types/survey-types'
import { generateSessionId, validateAnswer } from '@/lib/utils/survey-utils'
import SurveyQuestionRenderer from '@/components/survey/survey-question-renderer'
import { toast } from 'sonner'

export default function PublicSurveyPage({ params }: { params: { code: string } }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [questions, setQuestions] = useState<SurveyQuestion[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Map<string, AnswerValue>>(new Map())
    const [sessionId] = useState(() => generateSessionId())

    useEffect(() => {
        loadSurvey()
        // Load saved answers from localStorage
        const saved = localStorage.getItem(`survey_${params.code}`)
        if (saved) {
            try {
                const savedAnswers = JSON.parse(saved)
                setAnswers(new Map(Object.entries(savedAnswers)))
            } catch (e) {
                console.error('Error loading saved answers:', e)
            }
        }
    }, [params.code])

    const loadSurvey = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/public/surveys/${params.code}`)

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error('Enquete não encontrada')
                } else if (response.status === 403) {
                    toast.error('Esta enquete não está mais disponível')
                }
                router.push('/')
                return
            }

            const data = await response.json()
            setSurvey(data.survey)
            setQuestions(data.questions)
        } catch (error) {
            console.error('Error loading survey:', error)
            toast.error('Erro ao carregar enquete')
            router.push('/')
        } finally {
            setLoading(false)
        }
    }

    const currentQuestion = questions[currentQuestionIndex]
    const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) || null : null
    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

    const handleAnswerChange = (answer: AnswerValue) => {
        if (!currentQuestion) return

        const newAnswers = new Map(answers)
        newAnswers.set(currentQuestion.id, answer)
        setAnswers(newAnswers)

        // Save to localStorage
        const answersObj = Object.fromEntries(newAnswers)
        localStorage.setItem(`survey_${params.code}`, JSON.stringify(answersObj))
    }

    const canGoNext = () => {
        if (!currentQuestion) return false
        if (!currentQuestion.is_required) return true
        return validateAnswer(currentQuestion, currentAnswer)
    }

    const handleNext = () => {
        if (!canGoNext()) {
            toast.error('Por favor, responda esta pergunta obrigatória')
            return
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
        }
    }

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1)
        }
    }

    const handleSubmit = async () => {
        if (!canGoNext()) {
            toast.error('Por favor, responda esta pergunta obrigatória')
            return
        }

        // Validate all required questions are answered
        for (const question of questions) {
            if (question.is_required && !validateAnswer(question, answers.get(question.id) || null)) {
                toast.error(`Por favor, responda todas as perguntas obrigatórias`)
                return
            }
        }

        try {
            setSubmitting(true)

            const submission = {
                session_id: sessionId,
                answers: Array.from(answers.entries()).map(([question_id, answer_value]) => ({
                    question_id,
                    answer_value
                }))
            }

            const response = await fetch(`/api/public/surveys/${params.code}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission)
            })

            if (response.ok) {
                // Clear localStorage
                localStorage.removeItem(`survey_${params.code}`)
                // Redirect to thank you page
                router.push(`/enquete/${params.code}/obrigado`)
            } else {
                const error = await response.json()
                toast.error(error.message || 'Erro ao enviar respostas')
            }
        } catch (error) {
            console.error('Error submitting survey:', error)
            toast.error('Erro ao enviar respostas')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <p className="text-muted-foreground">Carregando enquete...</p>
            </div>
        )
    }

    if (!survey || !currentQuestion) {
        return null
    }

    const isLastQuestion = currentQuestionIndex === questions.length - 1

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">{survey.name}</h1>
                    {survey.description && (
                        <p className="text-lg text-muted-foreground">{survey.description}</p>
                    )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Question Card */}
                <Card className="shadow-lg">
                    <CardContent className="p-8">
                        <SurveyQuestionRenderer
                            question={currentQuestion}
                            answer={currentAnswer}
                            onChange={handleAnswerChange}
                        />
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                    </Button>

                    {isLastQuestion ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || !canGoNext()}
                            size="lg"
                        >
                            {submitting ? 'Enviando...' : 'Enviar Respostas'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            disabled={!canGoNext()}
                            size="lg"
                        >
                            Próxima
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
