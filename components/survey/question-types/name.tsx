'use client'

import { Input } from '@/components/ui/input'
import { User } from 'lucide-react'

interface NameQuestionProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export default function NameQuestion({ value, onChange, placeholder }: NameQuestionProps) {
    return (
        <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || 'Seu nome completo'}
                className="pl-10 text-base"
                autoComplete="name"
            />
        </div>
    )
}
