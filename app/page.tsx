"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Globe, BookOpen, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

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

          {/* Coluna Direita - Botões de Ação */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl p-8">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-white">Bem-vinda!</h2>
                  <p className="text-gray-300">
                    Escolha uma opção para continuar
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-6 text-lg shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/30"
                  >
                    ENTRAR
                  </Button>

                  <Button
                    onClick={() => router.push('/solicitar')}
                    variant="outline"
                    className="w-full border-2 border-teal-400/50 bg-white/5 hover:bg-white/10 text-white font-semibold py-6 text-lg transition-all"
                  >
                    CRIAR CONTA
                  </Button>
                </div>

                <p className="text-xs text-gray-400 text-center leading-relaxed pt-4">
                  Acesso exclusivo para habilitadas no Método Amanda Fernandes.
                </p>
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
