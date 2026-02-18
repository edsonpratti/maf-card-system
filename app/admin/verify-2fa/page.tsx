"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { validate2FACode, generateAndSend2FACode } from "@/app/actions/admin-2fa"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

function Verify2FAContent() {
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email")

    useEffect(() => {
        if (!email) {
            toast.error("Email não informado")
            router.push("/admin/login")
        }
    }, [email, router])

    const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        if (!email) {
            toast.error("Email não encontrado")
            return
        }

        if (code.length !== 6) {
            toast.error("O código deve ter 6 dígitos")
            return
        }

        setLoading(true)

        try {
            // Validar código 2FA
            const result = await validate2FACode(email, code)

            if (result.success) {
                toast.success("Código validado! Fazendo login...")
                
                // Recuperar credenciais do sessionStorage
                const storedEmail = sessionStorage.getItem("2fa_email")
                const storedPassword = sessionStorage.getItem("2fa_password")
                const storedTimestamp = sessionStorage.getItem("2fa_timestamp")

                // Verificar se as credenciais estão presentes e não expiraram (15 minutos)
                if (!storedEmail || !storedPassword || !storedTimestamp) {
                    toast.error("Sessão expirada. Faça login novamente.")
                    sessionStorage.clear()
                    router.push("/admin/login")
                    return
                }

                const timestamp = parseInt(storedTimestamp)
                const now = Date.now()
                const fifteenMinutes = 15 * 60 * 1000

                if (now - timestamp > fifteenMinutes) {
                    toast.error("Sessão expirada. Faça login novamente.")
                    sessionStorage.clear()
                    router.push("/admin/login")
                    return
                }

                // Verificar se o email bate
                if (storedEmail !== email) {
                    toast.error("Email não corresponde. Faça login novamente.")
                    sessionStorage.clear()
                    router.push("/admin/login")
                    return
                }

                // Fazer login com as credenciais armazenadas
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: storedEmail,
                    password: storedPassword,
                })

                // Limpar credenciais do sessionStorage
                sessionStorage.removeItem("2fa_email")
                sessionStorage.removeItem("2fa_password")
                sessionStorage.removeItem("2fa_timestamp")

                if (error) {
                    console.error("Erro ao fazer login:", error)
                    toast.error("Erro ao completar login")
                    router.push("/admin/login")
                    return
                }

                if (data.user) {
                    toast.success("Login realizado com sucesso!")
                    // Aguardar cookies serem salvos
                    await new Promise(resolve => setTimeout(resolve, 500))
                    window.location.href = "/admin/dashboard"
                }
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Erro ao validar código:", error)
            toast.error("Erro inesperado ao validar código")
        } finally {
            setLoading(false)
        }
    }

    const handleResendCode = async () => {
        if (!email) {
            toast.error("Email não encontrado")
            return
        }

        setResendLoading(true)

        try {
            const result = await generateAndSend2FACode(email)

            if (result.success) {
                toast.success("Novo código enviado!")
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Erro ao reenviar código:", error)
            toast.error("Erro ao reenviar código")
        } finally {
            setResendLoading(false)
        }
    }

    if (!email) {
        return null
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a1628]">
            {/* Efeito de Aurora/Brilho */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 via-cyan-500/10 to-transparent rounded-[100%] blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-400/10 via-teal-500/5 to-transparent rounded-[100%] blur-2xl transform scale-90" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-blue-500/5 to-transparent blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </div>

            {/* Header */}
            <header className="relative z-20 w-full">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/admin/login" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">M</span>
                            </div>
                            <span className="text-white font-semibold text-xl">MAF Pro</span>
                        </Link>
                        <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            Verificação 2FA
                        </span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 flex flex-col justify-center min-h-[calc(100vh-80px)] px-4">
                <Card className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
                    <CardHeader className="text-center px-4 sm:px-6 pt-6 pb-4">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <CardTitle className="text-white text-xl sm:text-2xl">
                            Verificação de Segurança
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-sm mt-2">
                            Um código de 6 dígitos foi enviado para<br />
                            <span className="text-emerald-400 font-medium">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-6">
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-gray-300 text-sm">
                                    Código de Acesso
                                </Label>
                                <Input
                                    id="code"
                                    name="code"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    required
                                    value={code}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "")
                                        setCode(value)
                                    }}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 h-14 text-center text-2xl font-mono tracking-widest"
                                    placeholder="000000"
                                    autoComplete="off"
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 text-center">
                                    O código expira em 10 minutos
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-semibold h-12 rounded-lg shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
                                disabled={loading || code.length !== 6}
                            >
                                {loading ? "Verificando..." : "Verificar Código"}
                            </Button>

                            <div className="text-center pt-4 space-y-3">
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={resendLoading}
                                    className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resendLoading ? "Enviando..." : "Não recebeu o código? Reenviar"}
                                </button>

                                <div className="border-t border-white/10 pt-3">
                                    <Link
                                        href="/admin/login"
                                        className="text-sm text-gray-400 hover:text-gray-300 hover:underline transition-colors"
                                    >
                                        ← Voltar para o login
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Box */}
                <div className="max-w-md mx-auto mt-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
                    <div className="flex items-start gap-3">
                        <span className="text-yellow-400 text-xl flex-shrink-0">💡</span>
                        <p className="text-sm text-gray-300">
                            Por questões de segurança, todos os administradores precisam validar seu acesso com um código enviado por email.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function Verify2FAPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Carregando...</p>
                </div>
            </div>
        }>
            <Verify2FAContent />
        </Suspense>
    )
}
