'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface SessionTimeoutProps {
  /**
   * Tempo de inatividade em minutos antes de mostrar o aviso
   * @default 25
   */
  warningTime?: number
  /**
   * Tempo de inatividade em minutos antes de fazer logout automático
   * @default 30
   */
  logoutTime?: number
  /**
   * Rota de redirecionamento após logout
   * @default '/login'
   */
  redirectTo?: string
}

export function SessionTimeout({ 
  warningTime = 25, 
  logoutTime = 30,
  redirectTo = '/login'
}: SessionTimeoutProps) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [showWarning, setShowWarning] = useState(false)
  const warningTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const logoutTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastActivityRef = useRef<number>(Date.now())

  const warningTimeMs = warningTime * 60 * 1000
  const logoutTimeMs = logoutTime * 60 * 1000

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push(redirectTo)
    router.refresh()
  }, [supabase, router, redirectTo])

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now()
    setShowWarning(false)

    // Limpar timeouts existentes
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current)
    }

    // Configurar timeout para aviso
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true)
    }, warningTimeMs)

    // Configurar timeout para logout
    logoutTimeoutRef.current = setTimeout(() => {
      handleLogout()
    }, logoutTimeMs)
  }, [warningTimeMs, logoutTimeMs, handleLogout])

  const handleContinueSession = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  useEffect(() => {
    // Eventos que indicam atividade do usuário
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // Throttle para evitar reset muito frequente (máximo 1x por segundo)
    let throttleTimeout: NodeJS.Timeout | null = null
    const handleActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimers()
          throttleTimeout = null
        }, 1000)
      }
    }

    // Adicionar event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    // Iniciar os timers
    resetTimers()

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current)
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
    }
  }, [resetTimers])

  // Calcular tempo restante
  const remainingMinutes = Math.ceil((logoutTimeMs - warningTimeMs) / 60000)

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão Inativa</AlertDialogTitle>
          <AlertDialogDescription>
            Sua sessão está inativa há algum tempo. Por motivos de segurança, 
            você será desconectado automaticamente em {remainingMinutes} {remainingMinutes === 1 ? 'minuto' : 'minutos'}.
          </AlertDialogDescription>
          <AlertDialogDescription className="font-medium text-foreground">
            Deseja continuar conectado?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>
            Sair Agora
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleContinueSession}>
            Continuar Conectado
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
