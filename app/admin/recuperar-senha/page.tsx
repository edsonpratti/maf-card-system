"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, KeyRound, CheckCircle2, XCircle } from "lucide-react"

type PageState = "loading" | "form" | "success" | "error"

export default function AdminRecuperarSenhaPage() {
    const [pageState, setPageState] = useState<PageState>("loading")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const tokenHash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (tokenHash && type === "recovery") {
            // Caminho 1: link gerado pelo nosso Resend (token_hash na query string)
            supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }).then(({ error }) => {
                if (error) {
                    console.error("[recovery] verifyOtp error:", error.message)
                    setPageState("error")
                } else {
                    setPageState("form")
                }
            })
            return
        }

        // Caminho 2: link enviado pelo próprio Supabase (redireciona com #access_token no hash)
        // Escuta o evento PASSWORD_RECOVERY que o Supabase JS dispara automaticamente
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setPageState("form")
            }
        })

        // Timeout: se em 5s nenhum token for detectado, mostra erro
        const timeout = setTimeout(() => {
            setPageState(prev => prev === "loading" ? "error" : prev)
        }, 5000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        if (password.length < 8) {
            toast.error("A senha deve ter no mínimo 8 caracteres.")
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem.")
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            toast.error("Erro ao atualizar senha: " + error.message)
            setLoading(false)
            return
        }

        await supabase.auth.signOut()
        setPageState("success")
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a1628] px-4">
            <Card className="w-full max-w-md bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
                {pageState === "loading" && (
                    <>
                        <CardHeader className="text-center">
                            <CardTitle className="text-white text-xl">Verificando link...</CardTitle>
                            <CardDescription className="text-gray-400">Aguarde um momento.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center pb-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                        </CardContent>
                    </>
                )}

                {pageState === "error" && (
                    <>
                        <CardHeader className="text-center">
                            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
                            <CardTitle className="text-white text-xl">Link inválido ou expirado</CardTitle>
                            <CardDescription className="text-gray-400">
                                Este link de redefinição de senha é inválido ou já expirou. Solicite um novo reset pelo painel de admins.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push("/admin/login")}
                            >
                                Voltar para Login
                            </Button>
                        </CardContent>
                    </>
                )}

                {pageState === "form" && (
                    <>
                        <CardHeader className="text-center">
                            <KeyRound className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                            <CardTitle className="text-white text-xl">Redefinir Senha</CardTitle>
                            <CardDescription className="text-gray-400">
                                Escolha uma nova senha para sua conta de administrador.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-300">Nova Senha</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        minLength={8}
                                        placeholder="Mínimo 8 caracteres"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Nova Senha</Label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        required
                                        minLength={8}
                                        placeholder="Repita a nova senha"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
                                    ) : "Salvar Nova Senha"}
                                </Button>
                            </form>
                        </CardContent>
                    </>
                )}

                {pageState === "success" && (
                    <>
                        <CardHeader className="text-center">
                            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
                            <CardTitle className="text-white text-xl">Senha redefinida!</CardTitle>
                            <CardDescription className="text-gray-400">
                                Sua senha foi atualizada com sucesso. Faça login com a nova senha.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => router.push("/admin/login")}
                            >
                                Ir para Login
                            </Button>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    )
}


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        if (password.length < 8) {
            toast.error("A senha deve ter no mínimo 8 caracteres.")
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem.")
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            toast.error("Erro ao atualizar senha: " + error.message)
            setLoading(false)
            return
        }

        await supabase.auth.signOut()
        setPageState("success")
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a1628] px-4">
            <Card className="w-full max-w-md bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
                {pageState === "loading" && (
                    <>
                        <CardHeader className="text-center">
                            <CardTitle className="text-white text-xl">Verificando link...</CardTitle>
                            <CardDescription className="text-gray-400">Aguarde um momento.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center pb-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                        </CardContent>
                    </>
                )}

                {pageState === "error" && (
                    <>
                        <CardHeader className="text-center">
                            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
                            <CardTitle className="text-white text-xl">Link inválido ou expirado</CardTitle>
                            <CardDescription className="text-gray-400">
                                Este link de redefinição de senha é inválido ou já expirou. Solicite um novo reset pelo painel de admins.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push("/admin/login")}
                            >
                                Voltar para Login
                            </Button>
                        </CardContent>
                    </>
                )}

                {pageState === "form" && (
                    <>
                        <CardHeader className="text-center">
                            <KeyRound className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                            <CardTitle className="text-white text-xl">Redefinir Senha</CardTitle>
                            <CardDescription className="text-gray-400">
                                Escolha uma nova senha para sua conta de administrador.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-300">Nova Senha</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        minLength={8}
                                        placeholder="Mínimo 8 caracteres"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Nova Senha</Label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        required
                                        minLength={8}
                                        placeholder="Repita a nova senha"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
                                    ) : "Salvar Nova Senha"}
                                </Button>
                            </form>
                        </CardContent>
                    </>
                )}

                {pageState === "success" && (
                    <>
                        <CardHeader className="text-center">
                            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
                            <CardTitle className="text-white text-xl">Senha redefinida!</CardTitle>
                            <CardDescription className="text-gray-400">
                                Sua senha foi atualizada com sucesso. Faça login com a nova senha.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => router.push("/admin/login")}
                            >
                                Ir para Login
                            </Button>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    )
}
