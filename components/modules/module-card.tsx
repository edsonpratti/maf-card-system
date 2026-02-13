'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Module } from '@/lib/modules'
import { ArrowRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
  module: Module
}

export function ModuleCard({ module }: ModuleCardProps) {
  const isDisabled = module.status !== 'active'
  const Icon = module.icon

  const cardContent = (
    <Card 
      className={cn(
        "transition-all duration-300 hover:shadow-lg",
        isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-105"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div 
            className={cn(
              "p-3 rounded-lg mb-4",
              module.color
            )}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>
          {module.badge && (
            <Badge variant={module.status === 'active' ? 'success' : 'secondary'}>
              {module.badge}
            </Badge>
          )}
          {module.status === 'coming-soon' && (
            <Badge variant="warning">
              Em breve
            </Badge>
          )}
          {module.status === 'disabled' && (
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              Bloqueado
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{module.title}</CardTitle>
        <CardDescription className="text-sm">
          {module.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {module.status === 'active' && (
          <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
            Acessar módulo
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        )}
        {module.status === 'coming-soon' && (
          <p className="text-sm text-muted-foreground">
            Este módulo estará disponível em breve
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (isDisabled) {
    return cardContent
  }

  return (
    <Link href={module.href} className="block">
      {cardContent}
    </Link>
  )
}
