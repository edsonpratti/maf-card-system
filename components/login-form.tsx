"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function LoginForm({ admin = false }: { admin?: boolean }) {
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
                // Aguarda um momento para garantir que os cookies sejam definidos
                await new Promise(resolve => setTimeout(resolve, 100))
                if (admin) {
                    window.location.href = "/admin/dashboard"
                } else {
                    router.push("/portal")
                    router.refresh()
                }
            }
        } catch {
            toast.error("Erro inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm mx-auto mt-20">
            <CardHeader>
                <CardTitle>{admin ? "Admin Login" : "Login da Aluna"}</CardTitle>
                <CardDescription>Entre com suas credenciais.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" name="email" type="email" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
