'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react'
import { Survey, SurveyQuestion, AnswerValue } from '@/lib/types/survey-types'
import { generateSessionId, validateAnswer } from '@/lib/utils/survey-utils'
import SurveyQuestionRenderer from '@/components/survey/survey-question-renderer'
import { toast } from 'sonner'

// Tipos de perguntas que auto-avançam ao responder (seleção única)
const AUTO_ADVANCE_TYPES = ['multiple_choice', 'linear_scale']

export default function PublicSurveyPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [started, setStarted] = useState(false)
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [questions, setQuestions] = useState<SurveyQuestion[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Map<string, AnswerValue>>(new Map())
    const [sessionId] = useState(() => generateSessionId())
    // Controla o maior índice de pergunta já alcançada (para restringir navegação)
    const [maxReachedIndex, setMaxReachedIndex] = useState(0)
    // Ref para evitar auto-avanço múltiplo
    const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        loadSurvey()
        // Load saved answers from localStorage
        const saved = localStorage.getItem(`survey_${code}`)
        if (saved) {
            try {
                const savedAnswers = JSON.parse(saved)
                setAnswers(new Map(Object.entries(savedAnswers)))
                // Se já tem respostas salvas, já iniciou a enquete
                setStarted(true)
            } catch (e) {
                console.error('Error loading saved answers:', e)
            }
        }
        // Load saved max reached index
        const savedMaxIndex = localStorage.getItem(`survey_${code}_maxIndex`)
        if (savedMaxIndex) {
            setMaxReachedIndex(parseInt(savedMaxIndex, 10))
        }
    }, [code])

    // Limpa timeout ao desmontar
    useEffect(() => {
        return () => {
            if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current)
            }
        }
    }, [])

    const loadSurvey = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/public/surveys/${code}`)

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

    const handleAnswerChange = (answer: AnswerValue) => {
        const currentQuestion = questions[currentQuestionIndex]
        if (!currentQuestion) return

        const newAnswers = new Map(answers)
        newAnswers.set(currentQuestion.id, answer)
        setAnswers(newAnswers)

        // Save to localStorage
        const answersObj = Object.fromEntries(newAnswers)
        localStorage.setItem(`survey_${code}`, JSON.stringify(answersObj))

        // Auto-avançar para perguntas de seleção única (não é a última pergunta)
        if (AUTO_ADVANCE_TYPES.includes(currentQuestion.question_type) && currentQuestionIndex < questions.length - 1) {
            // Limpa timeout anterior se existir
            if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current)
            }
            // Pequeno delay para feedback visual antes de avançar
            autoAdvanceTimeoutRef.current = setTimeout(() => {
                const nextIndex = currentQuestionIndex + 1
                setCurrentQuestionIndex(nextIndex)
                // Atualiza o máximo índice alcançado
                if (nextIndex > maxReachedIndex) {
                    setMaxReachedIndex(nextIndex)
                    localStorage.setItem(`survey_${code}_maxIndex`, nextIndex.toString())
                }
            }, 300)
        }
    }

    const canGoNext = () => {
        const currentQuestion = questions[currentQuestionIndex]
        if (!currentQuestion) return false
        if (!currentQuestion.is_required) return true
        const currentAnswer = answers.get(currentQuestion.id) || null
        return validateAnswer(currentQuestion, currentAnswer)
    }

    // Verifica se pode avançar para a próxima pergunta
    // Só permite se: a pergunta atual está respondida E (a próxima já foi alcançada OU estamos no máximo alcançado)
    const canNavigateNext = () => {
        if (!canGoNext()) return false
        // Se estamos no índice máximo já alcançado, podemos avançar (explorando novo território)
        if (currentQuestionIndex >= maxReachedIndex) return true
        // Se não estamos no máximo, só podemos avançar para perguntas já visitadas
        return currentQuestionIndex < maxReachedIndex
    }

    const handleNext = () => {
        if (!canGoNext()) {
            toast.error('Por favor, responda esta pergunta obrigatória')
            return
        }

        if (currentQuestionIndex < questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1
            setCurrentQuestionIndex(nextIndex)
            // Atualiza o máximo índice alcançado
            if (nextIndex > maxReachedIndex) {
                setMaxReachedIndex(nextIndex)
                localStorage.setItem(`survey_${code}_maxIndex`, nextIndex.toString())
            }
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

            const response = await fetch(`/api/public/surveys/${code}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission)
            })

            if (response.ok) {
                // Clear localStorage
                localStorage.removeItem(`survey_${code}`)
                localStorage.removeItem(`survey_${code}_maxIndex`)
                // Redirect to thank you page
                router.push(`/enquete/${code}/obrigado`)
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

    if (!survey || questions.length === 0) {
        return null
    }

    // Tela inicial - apresentação da enquete
    if (!started) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center py-6 sm:py-8 px-4">
                <Card className="max-w-xl w-full shadow-2xl">
                    <CardContent className="p-6 sm:p-10 text-center space-y-6 sm:space-y-8">
                        <div className="space-y-3 sm:space-y-4">
                            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{survey.name}</h1>
                            {survey.description && (
                                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                    {survey.description}
                                </p>
                            )}
                        </div>

                        <div className="pt-2 sm:pt-4">
                            <Button 
                                onClick={() => setStarted(true)} 
                                size="lg" 
                                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
                            >
                                <PlayCircle className="h-5 w-5 mr-2" />
                                Iniciar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) {
        return null
    }

    const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) || null : null
    const isLastQuestion = currentQuestionIndex === questions.length - 1

    // Tela de perguntas - apenas a pergunta, sem distrações
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col py-4 sm:py-8 px-3 sm:px-4">
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                {/* Question Card - centralizado */}
                <div className="flex-1 flex items-center justify-center">
                    <Card className="shadow-lg w-full">
                        <CardContent className="p-4 sm:p-8">
                            <SurveyQuestionRenderer
                                question={currentQuestion}
                                answer={currentAnswer}
                                onChange={handleAnswerChange}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation - fixo embaixo */}
                <div className="flex items-center justify-between pt-4 sm:pt-8 gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="h-10 sm:h-11 px-3 sm:px-4"
                    >
                        <ChevronLeft className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Anterior</span>
                    </Button>

                    {isLastQuestion ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || !canGoNext()}
                            size="lg"
                            className="h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
                        >
                            {submitting ? 'Enviando...' : 'Enviar'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            disabled={!canNavigateNext()}
                            size="lg"
                            className="h-10 sm:h-11 px-3 sm:px-4"
                        >
                            <span className="hidden sm:inline">Próxima</span>
                            <ChevronRight className="h-4 w-4 sm:ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
