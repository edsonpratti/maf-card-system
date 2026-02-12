import { ModuleCard } from "@/components/admin/module-card"
import { CreditCard, ClipboardList } from "lucide-react"

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Bem-vindo ao Painel Administrativo</h1>
                <p className="text-muted-foreground mt-2">
                    Selecione um módulo para gerenciar suas funcionalidades
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                <ModuleCard
                    title="MAF Pro ID"
                    description="Sistema de confecção e gestão de carteirinhas de identificação. Gerencie solicitações, aprove documentos e mantenha a base de alunas atualizada."
                    icon={CreditCard}
                    href="/admin/dashboard"
                    status="active"
                />

                <ModuleCard
                    title="MAF Pro Quiz"
                    description="Gerador de enquetes e questionários interativos. Crie, gerencie e analise pesquisas e quizzes para engajamento da comunidade."
                    icon={ClipboardList}
                    href="/admin/quiz"
                    status="development"
                />
            </div>

            <div className="mt-8 p-4 border rounded-lg bg-muted/50">
                <h2 className="text-lg font-semibold mb-2">Acesso Rápido</h2>
                <p className="text-sm text-muted-foreground">
                    Use o menu lateral para navegar diretamente para seções específicas de cada módulo.
                </p>
            </div>
        </div>
    )
}
