import SolicitationForm from "@/components/solicitation-form"
import Link from "next/link"

export default function SolicitarPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a1628]">
            {/* Efeito de Aurora/Brilho - Verde */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] lg:w-[1200px] h-[400px] sm:h-[500px] lg:h-[600px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/25 via-teal-500/15 to-transparent rounded-[100%] blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-400/15 via-cyan-500/8 to-transparent rounded-[100%] blur-2xl transform scale-90" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[200px] sm:h-[300px] lg:h-[400px] bg-gradient-radial from-emerald-500/10 to-transparent blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:80px_80px] opacity-40" />
            </div>

            {/* Header */}
            <header className="relative z-20 w-full">
                <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">M</span>
                            </div>
                            <span className="text-white font-bold text-lg sm:text-xl">MAF Pro</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 container mx-auto px-4 py-6 sm:py-10">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">Faça sua Solicitação</h1>
                    <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto px-4">
                        Preencha os dados abaixo para solicitar sua carteira profissional MAF Pro
                    </p>
                </div>
                <SolicitationForm />
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-4 sm:py-6 border-t border-white/5">
                <div className="container mx-auto px-4 sm:px-6">
                    <p className="text-center text-xs sm:text-sm text-gray-500">
                        © 2026 MAF Pro — O ecossistema oficial das habilitadas no Método Amanda Fernandes
                    </p>
                </div>
            </footer>
        </div>
    )
}
