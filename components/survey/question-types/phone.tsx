'use client'

import { Input } from '@/components/ui/input'
import { Phone } from 'lucide-react'
import { useState, useEffect } from 'react'

interface PhoneQuestionProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

// Formata o telefone no padrão brasileiro (XX) XXXXX-XXXX
function formatPhone(value: string): string {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limited = numbers.slice(0, 11)
    
    if (limited.length === 0) return ''
    if (limited.length <= 2) return `(${limited}`
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
}

// Extrai apenas os números para salvar
function extractNumbers(value: string): string {
    return value.replace(/\D/g, '')
}

export default function PhoneQuestion({ value, onChange, placeholder }: PhoneQuestionProps) {
    const [displayValue, setDisplayValue] = useState('')

    useEffect(() => {
        // Formata o valor inicial se existir
        if (value) {
            setDisplayValue(formatPhone(value))
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value
        const formatted = formatPhone(input)
        setDisplayValue(formatted)
        
        // Envia apenas os números para o state pai
        const numbers = extractNumbers(input)
        onChange(numbers)
    }

    return (
        <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="tel"
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder || '(00) 00000-0000'}
                className="pl-10 text-base"
                maxLength={16}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                WhatsApp
            </span>
        </div>
    )
}
