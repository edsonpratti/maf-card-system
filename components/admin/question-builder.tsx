'use client'

import { useState } from 'react'
import { SurveyQuestion } from '@/lib/types/survey-types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, GripVertical, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface QuestionBuilderProps {
    questions: SurveyQuestion[]
    onEdit: (question: SurveyQuestion) => void
    onDelete: (questionId: string) => void
    onDuplicate: (question: SurveyQuestion) => void
    onReorder: (questions: SurveyQuestion[]) => void
}

export default function QuestionBuilder({
    questions,
    onEdit,
    onDelete,
    onDuplicate,
    onReorder
}: QuestionBuilderProps) {
    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === questions.length - 1)
        ) {
            return
        }

        const newQuestions = [...questions]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        // Swap
        [newQuestions[index], newQuestions[targetIndex]] =
            [newQuestions[targetIndex], newQuestions[index]]

        // Update order_index
        newQuestions.forEach((q, i) => {
            q.order_index = i
        })

        onReorder(newQuestions)
    }

    const getQuestionTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            short_text: 'Texto Curto',
            long_text: 'Texto Longo',
            multiple_choice: 'Múltipla Escolha',
            checkboxes: 'Caixas de Seleção',
            linear_scale: 'Escala Linear'
        }
        return labels[type] || type
    }

    if (questions.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    Nenhuma pergunta adicionada ainda. Clique em "Adicionar Pergunta" para começar.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {questions.map((question, index) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex flex-col gap-1 mt-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 cursor-move"
                                    disabled
                                >
                                    <GripVertical className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                Pergunta {index + 1}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {getQuestionTypeLabel(question.question_type)}
                                            </Badge>
                                            {question.is_required && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Obrigatória
                                                </Badge>
                                            )}
                                        </div>
                                        <h4 className="font-medium mb-1">{question.title}</h4>
                                        {question.subtitle && (
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {question.subtitle}
                                            </p>
                                        )}

                                        {/* Show preview based on type */}
                                        {(question.question_type === 'multiple_choice' || question.question_type === 'checkboxes') && (
                                            <div className="mt-2 space-y-1">
                                                {((question.settings as any).options || []).slice(0, 3).map((opt: string, i: number) => (
                                                    <div key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <span className="w-4 h-4 border rounded-sm inline-block" />
                                                        {opt}
                                                    </div>
                                                ))}
                                                {((question.settings as any).options || []).length > 3 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        +{((question.settings as any).options.length - 3)} mais
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {question.question_type === 'linear_scale' && (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                Escala de {(question.settings as any).min} a {(question.settings as any).max}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => moveQuestion(index, 'up')}
                                    disabled={index === 0}
                                >
                                    ↑
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => moveQuestion(index, 'down')}
                                    disabled={index === questions.length - 1}
                                >
                                    ↓
                                </Button>
                            </div>

                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onEdit(question)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onDuplicate(question)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => onDelete(question.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
