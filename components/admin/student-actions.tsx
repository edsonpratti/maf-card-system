"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { resendPasswordResetEmail, resendCardDownloadEmail } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Key, Download } from "lucide-react"

type StudentActionsProps = {
    student: {
        id: string
        name: string
        email: string
        auth_user_id: string | null
        status: string
        card_number: string | null
    }
}

export default function StudentActions({ student }: StudentActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleResendPassword = async () => {
        if (!confirm(`Deseja reenviar email de redefinição de senha para ${student.name}?`)) {
            return
        }

        setLoading(true)
        try {
            const result = await resendPasswordResetEmail(student.id)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Erro ao reenviar senha:", error)
            toast.error("Erro ao reenviar email")
        } finally {
            setLoading(false)
        }
    }

    const handleResendCardDownload = async () => {
        if (!confirm(`Deseja reenviar email com link de download do cartão para ${student.name}?`)) {
            return
        }

        setLoading(true)
        try {
            const result = await resendCardDownloadEmail(student.id)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Erro ao reenviar download:", error)
            toast.error("Erro ao reenviar email")
        } finally {
            setLoading(false)
        }
    }

    // Só mostra os botões se o usuário já criou conta (tem auth_user_id)
    if (!student.auth_user_id) {
        return (
            <div className="text-xs text-muted-foreground italic">
                Usuário ainda não criou conta
            </div>
        )
    }

    return (
        <div className="flex gap-2">
            <Button 
                onClick={handleResendPassword} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
                {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                <Key className="mr-1 h-3 w-3" />
                Senha
            </Button>

            <Button 
                onClick={handleResendCardDownload} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
                {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                <Download className="mr-1 h-3 w-3" />
                Cartão
            </Button>
        </div>
    )
}
