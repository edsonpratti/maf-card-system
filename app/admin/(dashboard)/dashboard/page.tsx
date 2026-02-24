import { ModuleCard } from "@/components/admin/module-card"
import { CreditCard, ClipboardList, Users, Settings, ListTodo } from "lucide-react"

export default function DashboardPage() {
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
                    description="Sistema de confecção e gestão de carteirinhas de identificação. Gerencie solicitações, valide certificados e mantenha a base de alunas atualizada."
                    icon={CreditCard}
                    href="/admin/solicitacoes"
                    status="active"
                />

                <ModuleCard
                    title="MAF Pro Quiz"
                    description="Gerador de enquetes e questionários interativos. Crie, gerencie e analise pesquisas e quizzes para engajamento da comunidade."
                    icon={ClipboardList}
                    href="/admin/enquetes"
                    status="active"
                />

                <ModuleCard
                    title="MAF Pro Tasks"
                    description="Sistema de gerenciamento de tarefas internas da equipe administrativa. Crie, atribua e acompanhe o progresso das tarefas por prioridade e status."
                    icon={ListTodo}
                    href="/admin/tarefas"
                    status="active"
                />

                <ModuleCard
                    title="Gestão de Usuários"
                    description="Visualize e gerencie todos os usuários cadastrados no sistema, independente do módulo."
                    icon={Users}
                    href="/admin/usuarios"
                    status="active"
                />

                <ModuleCard
                    title="Configurações"
                    description="Configure o comportamento do sistema, validações automáticas e notificações por email."
                    icon={Settings}
                    href="/admin/configuracoes"
                    status="active"
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
