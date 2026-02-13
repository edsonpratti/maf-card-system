'use client'

import { SurveyQuestion, AnswerValue, MultipleChoiceSettings, CheckboxSettings, LinearScaleSettings } from '@/lib/types/survey-types'
import NameQuestion from './question-types/name'
import ShortTextQuestion from './question-types/short-text'
import LongTextQuestion from './question-types/long-text'
import MultipleChoiceQuestion from './question-types/multiple-choice'
import CheckboxesQuestion from './question-types/checkboxes'
import LinearScaleQuestion from './question-types/linear-scale'
import EmailQuestion from './question-types/email'
import PhoneQuestion from './question-types/phone'

interface SurveyQuestionRendererProps {
    question: SurveyQuestion
    answer: AnswerValue | null
    onChange: (answer: AnswerValue) => void
}

export default function SurveyQuestionRenderer({ question, answer, onChange }: SurveyQuestionRendererProps) {
    const renderQuestion = () => {
        switch (question.question_type) {
            case 'name':
                return (
                    <NameQuestion
                        value={(answer as any)?.text || ''}
                        onChange={(text) => onChange({ text })}
                        placeholder={(question.settings as any)?.placeholder}
                    />
                )

            case 'short_text':
                return (
                    <ShortTextQuestion
                        value={(answer as any)?.text || ''}
                        onChange={(text) => onChange({ text })}
                        placeholder={(question.settings as any)?.placeholder}
                    />
                )

            case 'long_text':
                return (
                    <LongTextQuestion
                        value={(answer as any)?.text || ''}
                        onChange={(text) => onChange({ text })}
                        placeholder={(question.settings as any)?.placeholder}
                    />
                )

            case 'multiple_choice':
                const mcSettings = question.settings as MultipleChoiceSettings
                return (
                    <MultipleChoiceQuestion
                        options={mcSettings.options}
                        value={(answer as any)?.selected || ''}
                        onChange={(selected) => onChange({ selected })}
                    />
                )

            case 'checkboxes':
                const cbSettings = question.settings as CheckboxSettings
                return (
                    <CheckboxesQuestion
                        options={cbSettings.options}
                        value={(answer as any)?.selected || []}
                        onChange={(selected) => onChange({ selected })}
                    />
                )

            case 'linear_scale':
                const lsSettings = question.settings as LinearScaleSettings
                return (
                    <LinearScaleQuestion
                        min={lsSettings.min}
                        max={lsSettings.max}
                        minLabel={lsSettings.minLabel}
                        maxLabel={lsSettings.maxLabel}
                        value={(answer as any)?.value || null}
                        onChange={(value) => onChange({ value })}
                    />
                )

            case 'email':
                return (
                    <EmailQuestion
                        value={(answer as any)?.text || ''}
                        onChange={(text) => onChange({ text })}
                        placeholder={(question.settings as any)?.placeholder}
                    />
                )

            case 'phone':
                return (
                    <PhoneQuestion
                        value={(answer as any)?.text || ''}
                        onChange={(text) => onChange({ text })}
                        placeholder={(question.settings as any)?.placeholder}
                    />
                )

            default:
                return <p className="text-muted-foreground">Tipo de pergunta não suportado</p>
        }
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h2 className="text-lg sm:text-xl font-bold mb-1">{question.title}</h2>
                {question.subtitle && (
                    <p className="text-sm text-muted-foreground">{question.subtitle}</p>
                )}
                {question.is_required && (
                    <p className="text-xs text-destructive mt-1">* Obrigatória</p>
                )}
            </div>
            {renderQuestion()}
        </div>
    )
}
