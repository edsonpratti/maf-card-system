'use client'

import { Textarea } from '@/components/ui/textarea'

interface LongTextQuestionProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export default function LongTextQuestion({ value, onChange, placeholder }: LongTextQuestionProps) {
    return (
        <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Sua resposta'}
            rows={5}
            className="text-lg resize-none"
        />
    )
}
