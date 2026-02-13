"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { resendPasswordResetEmail, resendCardDownloadEmail, deleteUser, toggleUserStatus } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Key, Download, Trash2, UserX, UserCheck, MoreVertical } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type StudentActionsProps = {
    student: {
        id: string
        name: string
        email: string
        auth_user_id: string | null
        status: string
        card_number: string | null
        is_disabled?: boolean | null
    }
    onUpdate?: () => void
}

export default function StudentActions({ student, onUpdate }: StudentActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [disableDialogOpen, setDisableDialogOpen] = useState(false)

    const handleResendPassword = async () => {
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

    const handleDelete = async () => {
        setLoading(true)
        try {
            const result = await deleteUser(student.id)
            if (result.success) {
                toast.success(result.message)
                setDeleteDialogOpen(false)
                onUpdate?.()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Erro ao excluir usuário:", error)
            toast.error("Erro ao excluir usuário")
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async () => {
        setLoading(true)
        try {
            const result = await toggleUserStatus(student.id)
            if (result.success) {
                toast.success(result.message)
                setDisableDialogOpen(false)
                onUpdate?.()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Erro ao alterar status:", error)
            toast.error("Erro ao alterar status do usuário")
        } finally {
            setLoading(false)
        }
    }

    const isDisabled = student.is_disabled === true

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreVertical className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {student.auth_user_id && (
                        <>
                            <DropdownMenuItem onClick={handleResendPassword}>
                                <Key className="mr-2 h-4 w-4" />
                                Reenviar Senha
                            </DropdownMenuItem>
                            {/* Removido: Reenviar Cartão */}
                        </>
                    )}
                    
                    <DropdownMenuItem onClick={() => setDisableDialogOpen(true)}>
                        {isDisabled ? (
                            <>
                                <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                                <span className="text-green-600">Habilitar Usuário</span>
                            </>
                        ) : (
                            <>
                                <UserX className="mr-2 h-4 w-4 text-orange-600" />
                                <span className="text-orange-600">Desabilitar Usuário</span>
                            </>
                        )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Usuário
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário <strong>{student.name}</strong>?
                            <br /><br />
                            Esta ação é irreversível e irá remover todos os dados do usuário, incluindo a conta de acesso.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog de Confirmação de Desabilitar/Habilitar */}
            <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isDisabled ? "Habilitar Usuário" : "Desabilitar Usuário"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isDisabled ? (
                                <>
                                    Deseja habilitar o usuário <strong>{student.name}</strong>?
                                    <br /><br />
                                    O usuário poderá acessar o sistema novamente.
                                </>
                            ) : (
                                <>
                                    Deseja desabilitar o usuário <strong>{student.name}</strong>?
                                    <br /><br />
                                    O usuário não poderá acessar o sistema enquanto estiver desabilitado, mas seus dados serão mantidos.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleStatus}
                            disabled={loading}
                            className={isDisabled 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-orange-600 hover:bg-orange-700"
                            }
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isDisabled ? "Habilitar" : "Desabilitar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
