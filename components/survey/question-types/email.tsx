'use client'

import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'

interface EmailQuestionProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export default function EmailQuestion({ value, onChange, placeholder }: EmailQuestionProps) {
    return (
        <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="email"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || 'seu@email.com'}
                className="pl-10 text-base"
            />
        </div>
    )
}
