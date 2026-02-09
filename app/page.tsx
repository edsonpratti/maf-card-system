"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Globe, BookOpen, Shield } from "lucide-react"
import { toast } from "sonner"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "" })

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock - substituir com lógica real
    toast.info("Função de login em desenvolvimento")
    console.log("Login:", loginData)
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock - substituir com lógica real
    toast.info("Função de cadastro em desenvolvimento")
    console.log("Register:", registerData)
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

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-6 shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/30"
                    >
                      Entrar no MAF Pro
                    </Button>

                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      Acesso exclusivo para habilitadas no Método Amanda Fernandes.
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-gray-200">
                        Nome completo
                      </Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-gray-200">
                        E-mail
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-gray-200">
                        Senha
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
                        required
                      />
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
    </div>
  )
}
