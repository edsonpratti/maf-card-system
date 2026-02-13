'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { Survey } from '@/lib/types/survey-types'

export default function ThankYouPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params)
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSurvey()
    }, [code])

    const loadSurvey = async () => {
        try {
            const response = await fetch(`/api/public/surveys/${code}`)
            if (response.ok) {
                const data = await response.json()
                setSurvey(data.survey)
            }
        } catch (error) {
            console.error('Error loading survey:', error)
        } finally {
            setLoading(false)
        }
    }

    // Valores padrão caso não haja configuração
    const title = survey?.completion_title || 'Obrigado!'
    const subtitle = survey?.completion_subtitle || 'Suas respostas foram enviadas com sucesso. Agradecemos sua participação!'
    const showButton = survey?.completion_show_button || false
    const buttonText = survey?.completion_button_text || 'Saiba mais'
    const buttonUrl = survey?.completion_button_url || '/'

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4">
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardContent className="p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">{title}</h1>
                        {subtitle && (
                            <p className="text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {showButton && buttonUrl && (
                        <div className="pt-4">
                            <Link href={buttonUrl} target="_blank" rel="noopener noreferrer">
                                <Button className="w-full">
                                    {buttonText}
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
