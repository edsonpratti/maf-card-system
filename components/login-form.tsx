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
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error("Erro ao fazer login: " + error.message)
            } else {
                toast.success("Login realizado com sucesso!")
                // Aguarda os cookies serem salvos antes de redirecionar
                await new Promise(resolve => setTimeout(resolve, 500))
                if (admin) {
                    window.location.href = "/admin/dashboard"
                } else {
                    window.location.href = "/portal"
                }
            }
        } catch {
            toast.error("Erro inesperado")
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
        <Card className="w-full max-w-sm mx-auto mt-20">
            <CardHeader>
                <CardTitle>
                    {resetPassword ? "Recuperar Senha" : (admin ? "Admin Login" : "Login da Aluna")}
                </CardTitle>
                <CardDescription>
                    {resetPassword 
                        ? "Digite seu e-mail para receber o link de recuperação." 
                        : "Entre com suas credenciais."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {resetPassword ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => setResetPassword(false)}
                                disabled={loading}
                            >
                                Voltar
                            </Button>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Enviando..." : "Enviar"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <PasswordInput id="password" name="password" required />
                        </div>
                        {!admin && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setResetPassword(true)}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Esqueceu sua senha?
                                </button>
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Entrando..." : "Entrar"}
                        </Button>
                        {!admin && (
                            <div className="text-center pt-4 border-t">
                                <p className="text-sm text-gray-600">
                                    Nova por aqui?{" "}
                                    <Link href="/solicitar" className="text-blue-600 hover:underline font-medium">
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
