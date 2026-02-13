"use client"

import { getAdminUsers, createAdminUser } from "@/app/actions/admin-users"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAdminUsers().then(setAdmins)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createAdminUser(form.name, form.email, form.password)
    if (res.success) {
      toast.success(res.message)
      setForm({ name: "", email: "", password: "" })
      getAdminUsers().then(setAdmins)
    } else {
      toast.error(res.message)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usuários ADMIN</h1>
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Novo Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={form.name} onChange={handleChange} placeholder="Nome completo" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={handleChange} placeholder="email@exemplo.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={form.password} onChange={handleChange} placeholder="Senha" required />
              </div>
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar Admin"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Administradores Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {admins.length === 0 && <li className="text-muted-foreground">Nenhum admin cadastrado.</li>}
            {admins.map((admin) => (
              <li key={admin.id} className="border rounded p-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{admin.name}</span>
                  {admin.source === 'auth' && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Sistema
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{admin.email}</span>
                <span className="text-xs">Cadastrado em: {new Date(admin.created_at).toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
