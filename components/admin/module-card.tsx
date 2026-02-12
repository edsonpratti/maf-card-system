import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"

interface ModuleCardProps {
    title: string
    description: string
    icon: LucideIcon
    href: string
    status: "active" | "development"
}

export function ModuleCard({ title, description, icon: Icon, href, status }: ModuleCardProps) {
    const statusConfig = {
        active: { label: "Ativo", variant: "default" as const },
        development: { label: "Em Desenvolvimento", variant: "secondary" as const }
    }

    return (
        <Link href={href} className="block group">
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                    {title}
                                </CardTitle>
                            </div>
                        </div>
                        <Badge variant={statusConfig[status].variant}>
                            {statusConfig[status].label}
                        </Badge>
                    </div>
                    <CardDescription className="mt-3">
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                        <span>Acessar módulo</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
