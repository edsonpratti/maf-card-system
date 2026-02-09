"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Globe, BookOpen, Shield } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import RegisterModal from "@/components/register-modal"

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
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
        const isAdmin = data.user.user_metadata?.is_admin === true || data.user.app_metadata?.is_admin === true
        
        // Impedir que admins façam login pela página inicial (área de alunas)
        if (isAdmin) {
          toast.error("Acesso negado. Administradores devem utilizar o login específico em /admin/login")
          await supabase.auth.signOut()
          setLoading(false)
          return
        }
        
        toast.success("Login realizado com sucesso!")
        // Aguarda os cookies serem salvos antes de redirecionar
        await new Promise(resolve => setTimeout(resolve, 500))
        
        window.location.href = "/portal"
      }
    } catch (error) {
      console.error("Erro no login:", error)
      toast.error("Erro inesperado ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Abrir modal de cadastro completo
    setRegisterModalOpen(true)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#0d1235] to-[#0a0e27]">
      {/* Gradientes radiais de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          
          {/* Coluna Esquerda - Hero */}
          <div className="space-y-8">
            <div className="space-y-6">
              <Badge variant="outline" className="border-blue-400/30 bg-blue-500/10 text-blue-300 px-4 py-1.5 text-sm font-medium">
                Plataforma Oficial
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight">
                MAF Pro
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed max-w-xl">
                O ecossistema oficial das habilitadas no Método Amanda Fernandes.
              </p>
              
              <p className="text-gray-400 leading-relaxed max-w-xl">
                Aqui você centraliza sua identidade profissional, acessa conteúdos exclusivos e participa da comunidade profissional do método.
              </p>
            </div>

            {/* Grid de Features 2x2 */}
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 space-y-3 hover:bg-white/10 transition-colors">
                <CreditCard className="h-8 w-8 text-teal-400" />
                <p className="text-sm font-medium text-white leading-tight">
                  Carteira Profissional de Habilitada
                </p>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 space-y-3 hover:bg-white/10 transition-colors">
                <Globe className="h-8 w-8 text-blue-400" />
                <p className="text-sm font-medium text-white leading-tight">
                  Comunidade Profissional Fechada
                </p>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 space-y-3 hover:bg-white/10 transition-colors">
                <BookOpen className="h-8 w-8 text-purple-400" />
                <p className="text-sm font-medium text-white leading-tight">
                  Biblioteca de Materiais Oficiais
                </p>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 space-y-3 hover:bg-white/10 transition-colors">
                <Shield className="h-8 w-8 text-green-400" />
                <p className="text-sm font-medium text-white leading-tight">
                  Acesso Validado e Seguro
                </p>
              </Card>
            </div>
          </div>

          {/* Coluna Direita - Card de Autenticação */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-4 px-6 text-sm font-semibold transition-all ${
                    activeTab === "login"
                      ? "text-white border-b-2 border-teal-400 bg-white/5"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 py-4 px-6 text-sm font-semibold transition-all ${
                    activeTab === "register"
                      ? "text-white border-b-2 border-teal-400 bg-white/5"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  Criar conta
                </button>
              </div>

              {/* Conteúdo do Tab */}
              <div className="p-8">
                {activeTab === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-gray-200">
                        E-mail
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-200">
                        Senha
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
                        required
                      />
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="text-sm text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-6 shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/30"
                      disabled={loading}
                    >
                      {loading ? "Entrando..." : "Entrar no MAF Pro"}
                    </Button>

                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      Acesso exclusivo para habilitadas no Método Amanda Fernandes.
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-6">
                    <div className="space-y-4 text-center py-8">
                      <p className="text-gray-200">
                        Para criar sua conta no MAF Pro, você precisará preencher um formulário completo com seus dados e enviar seu certificado de habilitação no Método Amanda Fernandes.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-6 shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/30"
                    >
                      Criar conta no MAF Pro
                    </Button>

                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      Após criar a conta, você precisará validar sua habilitação para liberar o acesso.
                    </p>
                  </form>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 mt-20 border-t border-white/10">
        <p className="text-center text-sm text-gray-400">
          © 2026 MAF Pro — O ecossistema oficial das habilitadas no Método Amanda Fernandes
        </p>
      </footer>

      {/* Modal de Cadastro */}
      <RegisterModal open={registerModalOpen} onOpenChange={setRegisterModalOpen} />
    </div>
  )
}
