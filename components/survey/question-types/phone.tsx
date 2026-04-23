'use client'

import { Input } from '@/components/ui/input'
import { ChevronDown, Phone, Search } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { COUNTRIES, type Country } from '@/components/ui/phone-input'
import { cn } from '@/lib/utils'

interface PhoneQuestionProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

// Formata telefone BR: (XX) XXXXX-XXXX
function formatBR(numbers: string): string {
    const limited = numbers.slice(0, 11)
    if (limited.length === 0) return ''
    if (limited.length <= 2) return `(${limited}`
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
}

// Formata número internacional em grupos legíveis
function formatIntl(numbers: string): string {
    const limited = numbers.slice(0, 15)
    if (limited.length <= 4) return limited
    if (limited.length <= 8) return `${limited.slice(0, 4)} ${limited.slice(4)}`
    return `${limited.slice(0, 4)} ${limited.slice(4, 8)} ${limited.slice(8)}`
}

function getDefaultCountry(): Country {
    return COUNTRIES.find(c => c.code === 'BR') ?? COUNTRIES[0]
}

// Tenta detectar país a partir de um valor salvo (ex.: "+55 11999999999")
function parseValue(value: string): { country: Country; digits: string } {
    const defaultCountry = getDefaultCountry()
    if (!value) return { country: defaultCountry, digits: '' }

    const trimmed = value.trim()
    if (trimmed.startsWith('+')) {
        const match = [...COUNTRIES]
            .sort((a, b) => b.dial.length - a.dial.length)
            .find(c => trimmed.startsWith(c.dial))
        if (match) {
            return {
                country: match,
                digits: trimmed.slice(match.dial.length).replace(/\D/g, ''),
            }
        }
    }
    // Retrocompatível: valor legado só com dígitos → considera BR
    return { country: defaultCountry, digits: trimmed.replace(/\D/g, '') }
}

export default function PhoneQuestion({ value, onChange, placeholder }: PhoneQuestionProps) {
    const [country, setCountry] = useState<Country>(getDefaultCountry())
    const [digits, setDigits] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Hidrata a partir de valor inicial (apenas na montagem)
    useEffect(() => {
        const parsed = parseValue(value)
        setCountry(parsed.country)
        setDigits(parsed.digits)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fecha dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                setSearch('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50)
        }
    }, [isOpen])

    const emit = useCallback(
        (c: Country, d: string) => {
            const full = d ? `${c.dial} ${d}` : ''
            onChange(full)
        },
        [onChange]
    )

    const handleSelectCountry = (c: Country) => {
        setCountry(c)
        setIsOpen(false)
        setSearch('')
        emit(c, digits)
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '')
        const maxLen = country.code === 'BR' ? 11 : 15
        const limited = raw.slice(0, maxLen)
        setDigits(limited)
        emit(country, limited)
    }

    const isBR = country.code === 'BR'
    const displayValue = isBR ? formatBR(digits) : formatIntl(digits)
    const defaultPlaceholder = isBR ? '(00) 00000-0000' : '000 0000 0000'

    const filtered = search
        ? COUNTRIES.filter(
              c =>
                  c.name.toLowerCase().includes(search.toLowerCase()) ||
                  c.dial.includes(search) ||
                  c.code.toLowerCase().includes(search.toLowerCase())
          )
        : COUNTRIES

    return (
        <div className="relative flex items-center gap-0">
            {/* Seletor de país */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 h-10 px-2.5 rounded-l-md border border-r-0 border-input bg-background hover:bg-accent transition-colors shrink-0"
                aria-label="Selecionar país"
                aria-expanded={isOpen}
            >
                <span className="text-lg leading-none">{country.flag}</span>
                <span className="text-xs text-muted-foreground font-mono">
                    {country.dial}
                </span>
                <ChevronDown
                    className={cn(
                        'h-3 w-3 text-muted-foreground transition-transform',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {/* Input de telefone */}
            <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    type="tel"
                    inputMode="tel"
                    value={displayValue}
                    onChange={handlePhoneChange}
                    placeholder={placeholder || defaultPlaceholder}
                    className="pl-10 text-base rounded-l-none"
                />
            </div>

            {/* Dropdown de países */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 top-full left-0 mt-1 w-72 max-h-72 rounded-md border border-input bg-popover shadow-lg overflow-hidden flex flex-col"
                >
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar país..."
                                className="w-full h-8 pl-8 pr-2 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground">
                                Nenhum país encontrado
                            </div>
                        ) : (
                            filtered.map(c => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleSelectCountry(c)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                                        c.code === country.code && 'bg-accent'
                                    )}
                                >
                                    <span className="text-base leading-none">{c.flag}</span>
                                    <span className="flex-1 truncate">{c.name}</span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        {c.dial}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
