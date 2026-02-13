"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { solicitarRecuperacaoSenha } from "@/app/actions/recuperar-senha"

export default function LoginForm({ admin = false }: { admin?: boolean }) {
    const [resetPassword, setResetPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                // Mensagens de erro mais descritivas
                if (error.message.includes('Invalid login credentials')) {
                    toast.error("Email ou senha incorretos")
                } else if (error.message.includes('Email not confirmed')) {
                    toast.error("Email não confirmado. Verifique sua caixa de entrada.")
                } else {
                    toast.error("Erro ao fazer login: " + error.message)
                }
            } else if (data.user) {
                const isUserAdmin = data.user.user_metadata?.is_admin === true || data.user.app_metadata?.is_admin === true

                // Verificar se está tentando acessar a área correta
                if (admin && !isUserAdmin) {
                    toast.error("Acesso negado. Esta área é exclusiva para administradores.")
                    await supabase.auth.signOut()
                    setLoading(false)
                    return
                }

                // Impedir que admins façam login pela página de alunas
                if (!admin && isUserAdmin) {
                    toast.error("Acesso negado. Administradores devem utilizar o login específico em /admin/login")
                    await supabase.auth.signOut()
                    setLoading(false)
                    return
                }

                toast.success("Login realizado com sucesso!")
                // Aguarda os cookies serem salvos antes de redirecionar
                await new Promise(resolve => setTimeout(resolve, 500))

                if (admin) {
                    window.location.href = "/admin/dashboard"
                } else {
                    window.location.href = "/portal"
                }
            }
        } catch (error) {
            console.error("Erro no login:", error)
            toast.error("Erro inesperado ao fazer login")
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string

        try {
            const result = await solicitarRecuperacaoSenha(email)

            if (result.success) {
                toast.success(result.message)
                setResetPassword(false)
            } else {
                toast.error(result.message)
            }
        } catch {
            toast.error("Erro inesperado ao enviar email de recuperação.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm mx-auto bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
            <CardHeader className="text-center px-4 sm:px-6 pt-6 pb-4">
                <CardTitle className="text-white text-xl sm:text-2xl">
                    {resetPassword ? "Recuperar Senha" : (admin ? "Admin Login" : "Bem-vinda de volta!")}
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                    {resetPassword
                        ? "Digite seu e-mail para receber o link de recuperação."
                        : "Entre com suas credenciais para acessar o portal."}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6">
                {resetPassword ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300 text-sm">E-mail</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 text-base"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-white h-11"
                                onClick={() => setResetPassword(false)}
                                disabled={loading}
                            >
                                Voltar
                            </Button>
                            <Button
                                type="submit"
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11"
                                disabled={loading}
                            >
                                {loading ? "Enviando..." : "Enviar"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300 text-sm">E-mail</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 text-base"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300 text-sm">Senha</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 text-base"
                                placeholder="••••••••"
                            />
                        </div>
                        {!admin && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setResetPassword(true)}
                                    className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                                >
                                    Esqueceu sua senha?
                                </button>
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-5 h-12 rounded-full shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 text-base"
                            disabled={loading}
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </Button>
                        {!admin && (
                            <div className="text-center pt-4 border-t border-white/10">
                                <p className="text-sm text-gray-400">
                                    Nova por aqui?{" "}
                                    <Link href="/solicitar" className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium transition-colors">
                                        Faça seu cadastro
                                    </Link>
                                </p>
                            </div>
                        )}
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
