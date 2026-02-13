'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { generateSurveyCode } from '@/lib/utils/survey-utils'
import { CreateSurveyData } from '@/lib/types/survey-types'

export default function NovaSurveyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<CreateSurveyData>({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        code: generateSurveyCode()
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Nome da enquete é obrigatório')
            return
        }

        try {
            setLoading(true)
            const response = await fetch('/api/admin/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const survey = await response.json()
                toast.success('Enquete criada com sucesso!')
                router.push(`/admin/enquetes/${survey.id}/editar`)
            } else {
                const error = await response.json()
                toast.error(error.message || 'Erro ao criar enquete')
            }
        } catch (error) {
            console.error('Error creating survey:', error)
            toast.error('Erro ao criar enquete')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/enquetes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Nova Enquete</h1>
                    <p className="text-muted-foreground mt-1">
                        Crie uma nova enquete ou questionário
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Enquete *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Pesquisa de Satisfação 2024"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descreva o objetivo desta enquete (opcional)"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Data de Início *</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end_date">Data de Término</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Deixe em branco para enquete sem data de término
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Código Único</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="ABCD12"
                                    maxLength={10}
                                    className="font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setFormData({ ...formData, code: generateSurveyCode() })}
                                >
                                    Gerar Novo
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Este código será usado na URL pública: /enquete/{formData.code}
                            </p>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={loading} variant="success">
                                {loading ? 'Criando...' : 'Criar e Adicionar Perguntas'}
                            </Button>
                            <Link href="/admin/enquetes">
                                <Button type="button" variant="secondary">
                                    Cancelar
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
