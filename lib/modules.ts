import { LucideIcon } from 'lucide-react'

export interface Module {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: string
  status: 'active' | 'coming-soon' | 'disabled'
  badge?: string
}

export type ModuleStatus = 'active' | 'coming-soon' | 'disabled'
