"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateUserData } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Edit, Upload, X, User } from "lucide-react"

interface EditUserDataFormProps {
    user: {
        id: string
        name: string
        email: string
        cpf: string
        whatsapp: string
        address_json: any
        photo_path?: string | null
    }
    photoUrl?: string | null
}

export default function EditUserDataForm({ user, photoUrl }: EditUserDataFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    
    const address = user.address_json || {}
    
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        whatsapp: user.whatsapp,
        street: address.street || "",
        number: address.number || "",
        complement: address.complement || "",
        neighborhood: address.neighborhood || "",
        city: address.city || "",
        state: address.state || "",
        cep: address.cep || "",
    })

    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(photoUrl || null)
    const [photoBase64, setPhotoBase64] = useState<string | null>(null)
    const [removePhoto, setRemovePhoto] = useState(false)

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                toast.error("Por favor, selecione uma imagem válida")
                return
            }
            
            // Validar tamanho (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("A imagem deve ter no máximo 5MB")
                return
            }

            setPhotoFile(file)
            setRemovePhoto(false)
            
            // Criar preview e base64
            const reader = new FileReader()
            reader.onloadend = () => {
                const result = reader.result as string
                setPhotoPreview(result)
                setPhotoBase64(result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRemovePhoto = () => {
        setPhotoFile(null)
        setPhotoPreview(null)
        setPhotoBase64(null)
        setRemovePhoto(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await updateUserData(user.id, {
                name: formData.name,
                email: formData.email,
                cpf: formData.cpf,
                whatsapp: formData.whatsapp,
                address: {
                    street: formData.street,
                    number: formData.number,
                    complement: formData.complement,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    cep: formData.cep,
                },
                photoBase64: photoBase64,
                removePhoto: removePhoto
            })

            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Erro ao atualizar dados:", error)
            toast.error("Erro ao atualizar dados do usuário")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Cadastro
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Dados do Usuário</DialogTitle>
                    <DialogDescription>
                        Atualize as informações cadastrais do usuário. Todos os campos podem ser editados.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Foto */}
                    <div className="space-y-2">
                        <Label>Foto do Usuário</Label>
                        <div className="flex items-center gap-4">
                            {photoPreview ? (
                                <div className="relative">
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={handleRemovePhoto}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-12 w-12 text-gray-400" />
                                </div>
                            )}
                            
                            <div className="flex-1">
                                <Label htmlFor="photo" className="cursor-pointer">
                                    <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                                        <Upload className="h-4 w-4" />
                                        {photoPreview ? "Alterar foto" : "Fazer upload da foto"}
                                    </div>
                                </Label>
                                <Input
                                    id="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    JPG, PNG ou GIF (máx. 5MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dados Pessoais */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-semibold text-sm">Dados Pessoais</h3>
                            
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="cpf">CPF *</Label>
                                    <Input
                                        id="cpf"
                                        value={formData.cpf}
                                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                                    <Input
                                        id="whatsapp"
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Endereço */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-semibold text-sm">Endereço</h3>
                            
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cep">CEP</Label>
                                    <Input
                                        id="cep"
                                        value={formData.cep}
                                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="street">Rua</Label>
                                    <Input
                                        id="street"
                                        value={formData.street}
                                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="number">Número</Label>
                                    <Input
                                        id="number"
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="complement">Complemento</Label>
                                    <Input
                                        id="complement"
                                        value={formData.complement}
                                        onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="neighborhood">Bairro</Label>
                                    <Input
                                        id="neighborhood"
                                        value={formData.neighborhood}
                                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="state">Estado</Label>
                                    <Input
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar Alterações"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
