"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreditCard, Shield, Users, BookOpen, ChevronDown } from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a1628] text-white">
      {/* Background grid + glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:80px_80px] opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-semibold">MAF Pro</span>
            </Link>

            <nav className="hidden lg:flex items-center">
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 backdrop-blur">
                <Link href="/" className="px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-medium">
                  Home
                </Link>
                <Link href="#recursos" className="px-4 py-2 text-sm text-gray-300 hover:text-white flex items-center gap-1">
                  Recursos <ChevronDown className="h-3 w-3" />
                </Link>
                <Link href="#sobre" className="px-4 py-2 text-sm text-gray-300 hover:text-white flex items-center gap-1">
                  Sobre <ChevronDown className="h-3 w-3" />
                </Link>
                <Link href="#metodo" className="px-4 py-2 text-sm text-gray-300 hover:text-white flex items-center gap-1">
                  Método <ChevronDown className="h-3 w-3" />
                </Link>
                <Link href="#contato" className="px-4 py-2 text-sm text-gray-300 hover:text-white">
                  Contato
                </Link>
              </div>
            </nav>

            <div className="flex items-center gap-3">
              <Button asChild className="hidden sm:inline-flex bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-5">
                <Link href="/login">Acessar Portal</Link>
              </Button>
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10">
        <section className="container mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-4 py-2 text-xs text-emerald-300">
              O Futuro Começa com o MAF Pro
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Sua carreira <span className="text-emerald-400">profissional</span>
              <br />
              em outro nível
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-300">
              O ecossistema oficial das habilitadas no Método Amanda Fernandes.
              Centralize sua identidade profissional, acesse conteúdos exclusivos e faça
              parte da comunidade.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6">
                <Link href="/solicitar">Começar Agora</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 text-white rounded-full px-6 bg-transparent hover:bg-white/10">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>

          <div id="recursos" className="mt-14">
            <p className="text-center text-xs uppercase tracking-[0.2em] text-gray-400">
              Recursos Exclusivos
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-gray-300" />
                </div>
                <span className="text-xs text-gray-300">Carteira Digital</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-gray-300" />
                </div>
                <span className="text-xs text-gray-300">Acesso Seguro</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-300" />
                </div>
                <span className="text-xs text-gray-300">Comunidade</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-gray-300" />
                </div>
                <span className="text-xs text-gray-300">Biblioteca</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 MAF Pro — O ecossistema oficial das habilitadas no Método Amanda Fernandes</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-gray-300">Termos</Link>
            <Link href="#" className="hover:text-gray-300">Privacidade</Link>
            <Link href="#" className="hover:text-gray-300">Suporte</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
