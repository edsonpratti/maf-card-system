"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateRequestStatus, deleteRequest, resendFirstAccessEmail } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Mail } from "lucide-react"

export default function RequestActions({ request }: { request: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [rejectOpen, setRejectOpen] = useState(false)

    const handleApprove = async () => {
        if (!confirm("Tem certeza que deseja aprovar esta solicitação?")) return
        setLoading(true)
        try {
            const res = await updateRequestStatus(request.id, "APROVADA_MANUAL")
            if (res.success) {
                toast.success("Solicitação aprovada com sucesso!")
                router.refresh()
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error("Erro ao aprovar")
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!rejectReason) return
        setLoading(true)
        try {
            const res = await updateRequestStatus(request.id, "RECUSADA", rejectReason)
            if (res.success) {
                toast.success("Solicitação recusada.")
                setRejectOpen(false)
                router.refresh()
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error("Erro ao recusar")
        } finally {
            setLoading(false)
        }
    }

    const handleResendEmail = async () => {
        if (!confirm("Reenviar email de primeiro acesso para esta usuária?")) return
        setLoading(true)
        console.log("🔍 Reenviando email para request:", request)
        console.log("📧 ID sendo enviado:", request.id)
        try {
            const res = await resendFirstAccessEmail(request.id)
            console.log("📬 Resultado do reenvio:", res)
            if (res.success) {
                toast.success(res.message)
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            console.error("❌ Erro ao reenviar:", error)
            toast.error("Erro ao reenviar email")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex gap-4">
            {request.status === "PENDENTE_MANUAL" && (
                <>
                    <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Aprovar
                    </Button>

                    <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" disabled={loading}>
                                Recusar
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Recusar Solicitação</DialogTitle>
                                <DialogDescription>
                                    Informe o motivo da recusa. A usuária receberá esta notificação.
                                </DialogDescription>
                            </DialogHeader>
                            <Textarea
                                placeholder="Motivo da recusa..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
                                <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || loading}>
                                    Confirmar Recusa
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}

            {(request.status === "APROVADA_MANUAL" || request.status === "AUTO_APROVADA") && !request.auth_user_id && (
                <Button 
                    onClick={handleResendEmail} 
                    disabled={loading} 
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Mail className="mr-2 h-4 w-4" />
                    Reenviar Email de Primeiro Acesso
                </Button>
            )}

            {/* Other actions like Revoke could go here */}
        </div>
    )
}
