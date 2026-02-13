'use client'

import { useState } from 'react'
import { SurveyQuestion, QuestionType, CreateQuestionData, MultipleChoiceSettings, CheckboxSettings, LinearScaleSettings, TextSettings } from '@/lib/types/survey-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface QuestionFormProps {
    surveyId: string
    question?: SurveyQuestion
    onSave: (question: SurveyQuestion) => void
    onCancel: () => void
}

export default function QuestionForm({ surveyId, question, onSave, onCancel }: QuestionFormProps) {
    const [formData, setFormData] = useState<CreateQuestionData>(
        question || {
            title: '',
            subtitle: '',
            question_type: 'short_text',
            is_required: false,
            settings: {}
        }
    )

    const [options, setOptions] = useState<string[]>(
        (formData.question_type === 'multiple_choice' || formData.question_type === 'checkboxes')
            ? ((formData.settings as MultipleChoiceSettings | CheckboxSettings).options || ['', ''])
            : []
    )

    const [scaleSettings, setScaleSettings] = useState<LinearScaleSettings>(
        formData.question_type === 'linear_scale'
            ? (formData.settings as LinearScaleSettings)
            : { min: 1, max: 5, minLabel: '', maxLabel: '' }
    )

    const handleTypeChange = (type: QuestionType) => {
        setFormData({ ...formData, question_type: type, settings: {} })

        if (type === 'multiple_choice' || type === 'checkboxes') {
            setOptions(['', ''])
        } else if (type === 'linear_scale') {
            setScaleSettings({ min: 1, max: 5, minLabel: '', maxLabel: '' })
        }
    }

    const addOption = () => {
        setOptions([...options, ''])
    }

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index))
        }
    }

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            toast.error('Título da pergunta é obrigatório')
            return
        }

        // Build settings based on question type
        let settings: any = {}

        if (formData.question_type === 'multiple_choice' || formData.question_type === 'checkboxes') {
            const validOptions = options.filter(o => o.trim() !== '')
            if (validOptions.length < 2) {
                toast.error('Adicione pelo menos 2 opções')
                return
            }
            settings = { options: validOptions }
        } else if (formData.question_type === 'linear_scale') {
            if (scaleSettings.min >= scaleSettings.max) {
                toast.error('O valor mínimo deve ser menor que o máximo')
                return
            }
            settings = scaleSettings
        }

        const questionData: CreateQuestionData = {
            ...formData,
            settings
        }

        try {
            const url = question
                ? `/api/admin/surveys/${surveyId}/questions/${question.id}`
                : `/api/admin/surveys/${surveyId}/questions`

            const method = question ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            })

            if (response.ok) {
                const savedQuestion = await response.json()
                toast.success(question ? 'Pergunta atualizada!' : 'Pergunta adicionada!')
                onSave(savedQuestion)
            } else {
                toast.error('Erro ao salvar pergunta')
            }
        } catch (error) {
            console.error('Error saving question:', error)
            toast.error('Erro ao salvar pergunta')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{question ? 'Editar Pergunta' : 'Nova Pergunta'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título da Pergunta *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Qual é o seu nível de satisfação?"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subtitle">Subtítulo / Descrição</Label>
                        <Textarea
                            id="subtitle"
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            placeholder="Informações adicionais sobre a pergunta (opcional)"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="question_type">Tipo de Resposta *</Label>
                        <Select
                            value={formData.question_type}
                            onValueChange={(value) => handleTypeChange(value as QuestionType)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Nome</SelectItem>
                                <SelectItem value="email">E-mail</SelectItem>
                                <SelectItem value="phone">Telefone (WhatsApp)</SelectItem>
                                <SelectItem value="short_text">Texto Curto</SelectItem>
                                <SelectItem value="long_text">Texto Longo</SelectItem>
                                <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                                <SelectItem value="checkboxes">Caixas de Seleção</SelectItem>
                                <SelectItem value="linear_scale">Escala Linear</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Multiple Choice / Checkboxes Options */}
                    {(formData.question_type === 'multiple_choice' || formData.question_type === 'checkboxes') && (
                        <div className="space-y-2">
                            <Label>Opções *</Label>
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={option}
                                        onChange={(e) => updateOption(index, e.target.value)}
                                        placeholder={`Opção ${index + 1}`}
                                    />
                                    {options.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeOption(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Opção
                            </Button>
                        </div>
                    )}

                    {/* Linear Scale Settings */}
                    {formData.question_type === 'linear_scale' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min">Valor Mínimo *</Label>
                                    <Input
                                        id="min"
                                        type="number"
                                        value={scaleSettings.min}
                                        onChange={(e) => setScaleSettings({ ...scaleSettings, min: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max">Valor Máximo *</Label>
                                    <Input
                                        id="max"
                                        type="number"
                                        value={scaleSettings.max}
                                        onChange={(e) => setScaleSettings({ ...scaleSettings, max: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minLabel">Rótulo Mínimo</Label>
                                    <Input
                                        id="minLabel"
                                        value={scaleSettings.minLabel}
                                        onChange={(e) => setScaleSettings({ ...scaleSettings, minLabel: e.target.value })}
                                        placeholder="Ex: Ruim"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxLabel">Rótulo Máximo</Label>
                                    <Input
                                        id="maxLabel"
                                        value={scaleSettings.maxLabel}
                                        onChange={(e) => setScaleSettings({ ...scaleSettings, maxLabel: e.target.value })}
                                        placeholder="Ex: Excelente"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_required"
                            checked={formData.is_required}
                            onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                            className="rounded"
                        />
                        <Label htmlFor="is_required" className="cursor-pointer">
                            Pergunta obrigatória
                        </Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="submit" variant="success">
                            {question ? 'Atualizar Pergunta' : 'Adicionar Pergunta'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onCancel}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
