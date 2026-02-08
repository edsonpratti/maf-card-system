import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle, ShieldCheck, UserCheck } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center font-bold text-xl" href="/">
          MAF Habilitada
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/solicitar">
            Solicitar
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/portal">
            Portal da Aluna
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/admin/login">
            Admin
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
                  Carteirinha de Habilitada MAF
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Emita sua carteirinha digital, comprove sua formação e acesse benefícios exclusivos da comunidade MAF.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/solicitar">
                    Solicitar Carteirinha <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login">
                    Já sou cadastrada
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                  <CardTitle>Validação Automática</CardTitle>
                  <CardDescription>
                    Se você já está em nossa base de alunas, sua carteirinha é aprovada na hora.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <ShieldCheck className="h-10 w-10 text-blue-500 mb-2" />
                  <CardTitle>QR Code Seguro</CardTitle>
                  <CardDescription>
                    Cada carteirinha possui um QR Code único para validação pública instantânea.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <UserCheck className="h-10 w-10 text-purple-500 mb-2" />
                  <CardTitle>Portal Exclusivo</CardTitle>
                  <CardDescription>
                    Acompanhe sua solicitação e baixe a versão atualizada da sua carteirinha.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 MAF Habilitada. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Termos de Uso
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacidade
          </Link>
        </nav>
      </footer>
    </div>
  )
}
