import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function ThankYouPage({ params }: { params: { code: string } }) {
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
                        <h1 className="text-3xl font-bold">Obrigado!</h1>
                        <p className="text-muted-foreground">
                            Suas respostas foram enviadas com sucesso. Agradecemos sua participação!
                        </p>
                    </div>

                    <div className="pt-4">
                        <Link href="/">
                            <Button variant="outline" className="w-full">
                                Voltar ao Início
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
