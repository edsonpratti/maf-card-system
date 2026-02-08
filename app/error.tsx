'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to an error reporting service (optional)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle>Algo deu errado</CardTitle>
          </div>
          <CardDescription>
            Ocorreu um erro ao processar sua solicitação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error.digest && (
            <div className="rounded-md bg-gray-100 p-3 text-xs">
              <p className="font-mono text-gray-600">Digest: {error.digest}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} variant="default" className="flex-1">
              Tentar novamente
            </Button>
            <Button onClick={() => (window.location.href = '/')} variant="outline" className="flex-1">
              Página inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
