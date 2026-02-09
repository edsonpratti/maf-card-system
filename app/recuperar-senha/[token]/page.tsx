"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { validarTokenRecuperacao, redefinirSenha } from "@/app/actions/recuperar-senha"

export default function RecuperarSenhaPage({ params }: { params: { token: string } }) {
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(true)
    const [tokenValid, setTokenValid] = useState(false)
    const [email, setEmail] = useState("")
    const router = useRouter()

    useEffect(() => {
        const validateToken = async () => {
            const result = await validarTokenRecuperacao(params.token)
            
            if (result.valid && result.email) {
                setTokenValid(true)
                setEmail(result.email)
            } else {
                setTokenValid(false)
                toast.error(result.message || "Token inválido ou expirado.")
            }
            
            setValidating(false)
        }

        validateToken()
    }, [params.token])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const novaSenha = formData.get("password") as string
        const confirmarSenha = formData.get("confirmPassword") as string

        // Validações
        if (novaSenha.length < 6) {
            toast.error("A senha deve ter no mínimo 6 caracteres.")
            setLoading(false)
            return
        }

        if (novaSenha !== confirmarSenha) {
            toast.error("As senhas não coincidem.")
            setLoading(false)
            return
        }

        try {
            const result = await redefinirSenha(params.token, novaSenha)

            if (result.success) {
                toast.success(result.message)
                setTimeout(() => {
                    router.push("/login")
                }, 2000)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Erro ao redefinir senha. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    if (validating) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="mt-4 text-gray-600">Validando token...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">❌ Token Inválido</CardTitle>
                        <CardDescription>
                            Este link de recuperação é inválido ou já expirou.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            Solicite um novo link de recuperação de senha na página de login.
                        </p>
                        <Button 
                            onClick={() => router.push("/login")} 
                            className="w-full"
                        >
                            Voltar para Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>🔒 Redefinir Senha</CardTitle>
                    <CardDescription>
                        Digite sua nova senha para a conta: <strong>{email}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <PasswordInput 
                                id="password" 
                                name="password" 
                                required 
                                minLength={6}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <PasswordInput 
                                id="confirmPassword" 
                                name="confirmPassword" 
                                required 
                                minLength={6}
                                placeholder="Digite a senha novamente"
                            />
                        </div>

                        <div className="pt-2">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Redefinindo..." : "Redefinir Senha"}
                            </Button>
                        </div>

                        <div className="text-center pt-4 border-t">
                            <Button 
                                type="button"
                                variant="ghost"
                                onClick={() => router.push("/login")}
                                disabled={loading}
                            >
                                Voltar para Login
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
