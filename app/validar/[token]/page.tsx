import { getServiceSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default async function ValidarPage({ params }: { params: { token: string } }) {
    const supabase = getServiceSupabase()

    const { data: card } = await supabase
        .from("users_cards")
        .select("name, cpf, status, issued_at, card_number")
        .eq("validation_token", params.token)
        .single()

    let status = "inválido"
    if (card) {
        if (card.status === "AUTO_APROVADA" || card.status === "APROVADA_MANUAL") status = "válido"
        else if (card.status === "REVOGADA") status = "revogado"
        else status = "pendente" // Should not happen publically usually if logic is correct
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <CardTitle>Validação de Carteirinha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {status === "válido" && (
                        <>
                            <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
                            <h2 className="text-2xl font-bold text-green-700">Carteirinha Válida</h2>
                            <div className="text-left space-y-2 border-t pt-4">
                                <p><strong>Nome:</strong> {card?.name}</p>
                                <p><strong>CPF:</strong> ***.***.{card?.cpf.slice(-2)}</p>
                                <p><strong>Carteira Nº:</strong> {card?.card_number}</p>
                                <p><strong>Emissão:</strong> {new Date(card?.issued_at).toLocaleDateString()}</p>
                            </div>
                        </>
                    )}

                    {status === "inválido" && (
                        <>
                            <XCircle className="mx-auto h-20 w-20 text-red-500" />
                            <h2 className="text-2xl font-bold text-red-700">Carteirinha Inválida</h2>
                            <p className="text-muted-foreground">O código informado não foi encontrado em nossa base.</p>
                        </>
                    )}

                    {status === "revogado" && (
                        <>
                            <AlertTriangle className="mx-auto h-20 w-20 text-orange-500" />
                            <h2 className="text-2xl font-bold text-orange-700">Carteirinha Revogada</h2>
                            <p className="text-muted-foreground">Esta carteirinha foi cancelada pela instituição.</p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
