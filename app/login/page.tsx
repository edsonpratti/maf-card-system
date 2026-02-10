import LoginForm from "@/components/login-form"
import Link from "next/link"

export default function LoginPage() {
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
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">M</span>
                            </div>
                            <span className="text-white font-semibold text-xl">MAF Pro</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 flex flex-col justify-center min-h-[calc(100vh-80px)] px-4">
                <LoginForm />
            </main>
        </div>
    )
}
