'use client'

import { Input } from '@/components/ui/input'

interface ShortTextQuestionProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export default function ShortTextQuestion({ value, onChange, placeholder }: ShortTextQuestionProps) {
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Sua resposta'}
            className="text-lg"
        />
    )
}
