'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { verifyFirstAccessToken, setUserPassword } from '@/app/actions/first-access'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ token: string }>
}

export default function FirstAccessPage({ params }: PageProps) {
  const router = useRouter()
  const [token, setToken] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [validToken, setValidToken] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number
    feedback: string[]
  }>({ score: 0, feedback: [] })

  useEffect(() => {
    async function loadToken() {
      const resolvedParams = await params
      setToken(resolvedParams.token)
      await verifyToken(resolvedParams.token)
    }
    loadToken()
  }, [params])

  async function verifyToken(tokenValue: string) {
    try {
      const result = await verifyFirstAccessToken(tokenValue)
      
      if (result.valid && result.email && result.name) {
        setValidToken(true)
        setEmail(result.email)
        setName(result.name)
      } else {
        toast.error(result.error || 'Token inválido ou expirado')
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error)
      toast.error('Erro ao verificar o token')
      setTimeout(() => router.push('/login'), 3000)
    } finally {
      setLoading(false)
    }
  }

  function checkPasswordStrength(pwd: string) {
    const feedback: string[] = []
    let score = 0

    if (pwd.length >= 8) {
      score++
    } else {
      feedback.push('Mínimo de 8 caracteres')
    }

    if (/[A-Z]/.test(pwd)) {
      score++
    } else {
      feedback.push('Adicione letras maiúsculas')
    }

    if (/[a-z]/.test(pwd)) {
      score++
    } else {
      feedback.push('Adicione letras minúsculas')
    }

    if (/[0-9]/.test(pwd)) {
      score++
    } else {
      feedback.push('Adicione números')
    }

    if (/[^A-Za-z0-9]/.test(pwd)) {
      score++
    } else {
      feedback.push('Adicione caracteres especiais (!@#$%)')
    }

    setPasswordStrength({ score, feedback })
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    checkPasswordStrength(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (passwordStrength.score < 3) {
      toast.error('Senha muito fraca. Atenda aos requisitos mínimos de segurança')
      return
    }

    setSubmitting(true)

    try {
      const result = await setUserPassword(token, password)

      if (result.success) {
        toast.success('Senha definida com sucesso! Redirecionando para o login...')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        toast.error(result.error || 'Erro ao definir senha')
      }
    } catch (error) {
      console.error('Erro ao definir senha:', error)
      toast.error('Erro ao processar sua solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Verificando token...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!validToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Token Inválido</CardTitle>
            <CardDescription>
              O link que você acessou é inválido ou expirou. Você será redirecionado para a página de login.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500'
    if (passwordStrength.score === 3) return 'bg-yellow-500'
    if (passwordStrength.score === 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Fraca'
    if (passwordStrength.score === 3) return 'Média'
    if (passwordStrength.score === 4) return 'Boa'
    return 'Forte'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Defina sua Senha</CardTitle>
          <CardDescription>
            Olá, <strong>{name}</strong>! Crie uma senha para acessar sua carteirinha digital.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Digite sua senha"
                required
                disabled={submitting}
              />
              
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{getStrengthText()}</span>
                  </div>
                  
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-gray-600 space-y-1">
                      {passwordStrength.feedback.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <span className="text-red-500">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                disabled={submitting}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">As senhas não coincidem</p>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">Requisitos de senha:</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-1">
                  <span>{password.length >= 8 ? '✓' : '○'}</span> Mínimo de 8 caracteres
                </li>
                <li className="flex items-center gap-1">
                  <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span> Letras maiúsculas
                </li>
                <li className="flex items-center gap-1">
                  <span>{/[a-z]/.test(password) ? '✓' : '○'}</span> Letras minúsculas
                </li>
                <li className="flex items-center gap-1">
                  <span>{/[0-9]/.test(password) ? '✓' : '○'}</span> Números
                </li>
                <li className="flex items-center gap-1">
                  <span>{/[^A-Za-z0-9]/.test(password) ? '✓' : '○'}</span> Caracteres especiais
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || passwordStrength.score < 3 || password !== confirmPassword}
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Definindo senha...
                </>
              ) : (
                'Definir Senha e Acessar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
