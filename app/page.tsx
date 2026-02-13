"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Globe, BookOpen, Shield, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MobileNav } from "@/components/mobile-nav"

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a1628]">
      {/* Efeito de Aurora/Brilho */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Arco de luz principal - responsivo */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] lg:w-[1200px] h-[400px] sm:h-[500px] lg:h-[600px]">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 via-cyan-500/10 to-transparent rounded-[100%] blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-400/10 via-teal-500/5 to-transparent rounded-[100%] blur-2xl transform scale-90" />
        </div>
        {/* Brilho sutil no topo - responsivo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[200px] sm:h-[300px] lg:h-[400px] bg-gradient-radial from-blue-500/5 to-transparent blur-3xl" />
        {/* Grade de fundo sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] sm:bg-[size:100px_100px]" />
      </div>

      {/* Header/Navigation */}
      <header className="relative z-20 w-full">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-white font-semibold text-lg sm:text-xl">MAF Pro</span>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden lg:flex items-center">
              <div className="flex items-center bg-white/5 backdrop-blur-md rounded-full px-2 py-1 border border-white/10">
                <Link 
                  href="/" 
                  className="px-4 xl:px-5 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium transition-all"
                >
                  Home
                </Link>
                <Link 
                  href="#recursos" 
                  className="px-4 xl:px-5 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
                >
                  Recursos <ChevronDown className="w-3 h-3" />
                </Link>
                <Link 
                  href="#sobre" 
                  className="px-4 xl:px-5 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
                >
                  Sobre <ChevronDown className="w-3 h-3" />
                </Link>
                <Link 
                  href="#metodo" 
                  className="px-4 xl:px-5 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
                >
                  Método <ChevronDown className="w-3 h-3" />
                </Link>
                <Link 
                  href="#contato" 
                  className="px-4 xl:px-5 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Contato
                </Link>
              </div>
            </nav>

            {/* CTA Button + Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                onClick={() => router.push('/login')}
                className="hidden sm:flex bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 md:px-6 py-2 rounded-full transition-all shadow-lg shadow-emerald-500/25 text-sm"
              >
                Acessar Portal
              </Button>
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-32 lg:pb-40">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            {/* Badge */}
            <Badge className="bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-400 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full">
              O Futuro Começa com o MAF Pro
            </Badge>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
              Sua carreira{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                profissional
              </span>
              <br />
              em outro nível
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              O ecossistema oficial das habilitadas no Método Amanda Fernandes. 
              Centralize sua identidade profissional, acesse conteúdos exclusivos 
              e faça parte da comunidade.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4 sm:px-0">
              <Button 
                onClick={() => router.push('/solicitar')}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-105"
              >
                Começar Agora
              </Button>
              <Button 
                onClick={() => router.push('/login')}
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full transition-all backdrop-blur-sm"
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-gray-500 text-xs sm:text-sm uppercase tracking-wider font-medium">
              Recursos Exclusivos
            </p>
          </div>

          {/* Feature Icons - Grid responsivo */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-6 sm:gap-8 lg:gap-12 xl:gap-16">
            <div className="flex flex-col items-center gap-2 sm:gap-3 group cursor-pointer">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-white/10 group-hover:border-emerald-500/30 transition-all">
                <CreditCard className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-gray-400 text-xs sm:text-sm font-medium group-hover:text-white transition-colors text-center">Carteira Digital</span>
            </div>

            <div className="flex flex-col items-center gap-2 sm:gap-3 group cursor-pointer">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-white/10 group-hover:border-emerald-500/30 transition-all">
                <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-gray-400 text-xs sm:text-sm font-medium group-hover:text-white transition-colors text-center">Acesso Seguro</span>
            </div>

            <div className="flex flex-col items-center gap-2 sm:gap-3 group cursor-pointer">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-white/10 group-hover:border-emerald-500/30 transition-all">
                <Globe className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-gray-400 text-xs sm:text-sm font-medium group-hover:text-white transition-colors text-center">Comunidade</span>
            </div>

            <div className="flex flex-col items-center gap-2 sm:gap-3 group cursor-pointer">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-white/10 group-hover:border-emerald-500/30 transition-all">
                <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-gray-400 text-xs sm:text-sm font-medium group-hover:text-white transition-colors text-center">Biblioteca</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 sm:py-8 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:gap-0 sm:flex-row sm:justify-between">
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              © 2026 MAF Pro — O ecossistema oficial das habilitadas no Método Amanda Fernandes
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="#" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Termos
              </Link>
              <Link href="#" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Privacidade
              </Link>
              <Link href="#" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Suporte
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
