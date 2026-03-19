"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Country {
    code: string  // ISO 3166-1 alpha-2
    name: string
    dial: string  // e.g. "+55"
    flag: string  // emoji flag
}

export const COUNTRIES: Country[] = [
    { code: "BR", name: "Brasil", dial: "+55", flag: "🇧🇷" },
    { code: "US", name: "Estados Unidos", dial: "+1", flag: "🇺🇸" },
    { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
    { code: "ES", name: "Espanha", dial: "+34", flag: "🇪🇸" },
    { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
    { code: "CL", name: "Chile", dial: "+56", flag: "🇨🇱" },
    { code: "CO", name: "Colômbia", dial: "+57", flag: "🇨🇴" },
    { code: "MX", name: "México", dial: "+52", flag: "🇲🇽" },
    { code: "PE", name: "Peru", dial: "+51", flag: "🇵🇪" },
    { code: "UY", name: "Uruguai", dial: "+598", flag: "🇺🇾" },
    { code: "PY", name: "Paraguai", dial: "+595", flag: "🇵🇾" },
    { code: "BO", name: "Bolívia", dial: "+591", flag: "🇧🇴" },
    { code: "EC", name: "Equador", dial: "+593", flag: "🇪🇨" },
    { code: "VE", name: "Venezuela", dial: "+58", flag: "🇻🇪" },
    { code: "CR", name: "Costa Rica", dial: "+506", flag: "🇨🇷" },
    { code: "PA", name: "Panamá", dial: "+507", flag: "🇵🇦" },
    { code: "DO", name: "Rep. Dominicana", dial: "+1", flag: "🇩🇴" },
    { code: "CU", name: "Cuba", dial: "+53", flag: "🇨🇺" },
    { code: "GT", name: "Guatemala", dial: "+502", flag: "🇬🇹" },
    { code: "HN", name: "Honduras", dial: "+504", flag: "🇭🇳" },
    { code: "SV", name: "El Salvador", dial: "+503", flag: "🇸🇻" },
    { code: "NI", name: "Nicarágua", dial: "+505", flag: "🇳🇮" },
    { code: "GB", name: "Reino Unido", dial: "+44", flag: "🇬🇧" },
    { code: "FR", name: "França", dial: "+33", flag: "🇫🇷" },
    { code: "DE", name: "Alemanha", dial: "+49", flag: "🇩🇪" },
    { code: "IT", name: "Itália", dial: "+39", flag: "🇮🇹" },
    { code: "NL", name: "Holanda", dial: "+31", flag: "🇳🇱" },
    { code: "BE", name: "Bélgica", dial: "+32", flag: "🇧🇪" },
    { code: "CH", name: "Suíça", dial: "+41", flag: "🇨🇭" },
    { code: "AT", name: "Áustria", dial: "+43", flag: "🇦🇹" },
    { code: "SE", name: "Suécia", dial: "+46", flag: "🇸🇪" },
    { code: "NO", name: "Noruega", dial: "+47", flag: "🇳🇴" },
    { code: "DK", name: "Dinamarca", dial: "+45", flag: "🇩🇰" },
    { code: "FI", name: "Finlândia", dial: "+358", flag: "🇫🇮" },
    { code: "IE", name: "Irlanda", dial: "+353", flag: "🇮🇪" },
    { code: "PL", name: "Polônia", dial: "+48", flag: "🇵🇱" },
    { code: "CZ", name: "República Tcheca", dial: "+420", flag: "🇨🇿" },
    { code: "RO", name: "Romênia", dial: "+40", flag: "🇷🇴" },
    { code: "GR", name: "Grécia", dial: "+30", flag: "🇬🇷" },
    { code: "TR", name: "Turquia", dial: "+90", flag: "🇹🇷" },
    { code: "RU", name: "Rússia", dial: "+7", flag: "🇷🇺" },
    { code: "UA", name: "Ucrânia", dial: "+380", flag: "🇺🇦" },
    { code: "JP", name: "Japão", dial: "+81", flag: "🇯🇵" },
    { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
    { code: "KR", name: "Coreia do Sul", dial: "+82", flag: "🇰🇷" },
    { code: "IN", name: "Índia", dial: "+91", flag: "🇮🇳" },
    { code: "AU", name: "Austrália", dial: "+61", flag: "🇦🇺" },
    { code: "NZ", name: "Nova Zelândia", dial: "+64", flag: "🇳🇿" },
    { code: "CA", name: "Canadá", dial: "+1", flag: "🇨🇦" },
    { code: "ZA", name: "África do Sul", dial: "+27", flag: "🇿🇦" },
    { code: "IL", name: "Israel", dial: "+972", flag: "🇮🇱" },
    { code: "AE", name: "Emirados Árabes", dial: "+971", flag: "🇦🇪" },
    { code: "SA", name: "Arábia Saudita", dial: "+966", flag: "🇸🇦" },
    { code: "EG", name: "Egito", dial: "+20", flag: "🇪🇬" },
    { code: "NG", name: "Nigéria", dial: "+234", flag: "🇳🇬" },
    { code: "KE", name: "Quênia", dial: "+254", flag: "🇰🇪" },
    { code: "PH", name: "Filipinas", dial: "+63", flag: "🇵🇭" },
    { code: "TH", name: "Tailândia", dial: "+66", flag: "🇹🇭" },
    { code: "VN", name: "Vietnã", dial: "+84", flag: "🇻🇳" },
    { code: "ID", name: "Indonésia", dial: "+62", flag: "🇮🇩" },
    { code: "MY", name: "Malásia", dial: "+60", flag: "🇲🇾" },
    { code: "SG", name: "Singapura", dial: "+65", flag: "🇸🇬" },
    { code: "HK", name: "Hong Kong", dial: "+852", flag: "🇭🇰" },
    { code: "TW", name: "Taiwan", dial: "+886", flag: "🇹🇼" },
    { code: "AO", name: "Angola", dial: "+244", flag: "🇦🇴" },
    { code: "MZ", name: "Moçambique", dial: "+258", flag: "🇲🇿" },
    { code: "CV", name: "Cabo Verde", dial: "+238", flag: "🇨🇻" },
    { code: "GW", name: "Guiné-Bissau", dial: "+245", flag: "🇬🇼" },
    { code: "TL", name: "Timor-Leste", dial: "+670", flag: "🇹🇱" },
    { code: "ST", name: "São Tomé e Príncipe", dial: "+239", flag: "🇸🇹" },
]

interface InternationalPhoneInputProps {
    value: string
    onChange: (fullValue: string) => void
    className?: string
    id?: string
    disabled?: boolean
}

export function InternationalPhoneInput({
    value,
    onChange,
    className,
    id,
    disabled,
}: InternationalPhoneInputProps) {
    const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0])
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    // Parse initial value to extract country code and number
    useEffect(() => {
        if (value) {
            // Try to match a known dial code from the value
            const match = COUNTRIES
                .sort((a, b) => b.dial.length - a.dial.length) // longer codes first
                .find(c => value.startsWith(c.dial))
            if (match) {
                setSelectedCountry(match)
                setPhoneNumber(value.slice(match.dial.length).trim())
            } else {
                setPhoneNumber(value)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only on mount

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                setSearch("")
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Focus search when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50)
        }
    }, [isOpen])

    const emitChange = useCallback((country: Country, phone: string) => {
        const cleaned = phone.replace(/[^\d]/g, "")
        const full = cleaned ? `${country.dial} ${cleaned}` : ""
        onChange(full)
    }, [onChange])

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country)
        setIsOpen(false)
        setSearch("")
        emitChange(country, phoneNumber)
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^\d]/g, "")
        setPhoneNumber(raw)
        emitChange(selectedCountry, raw)
    }

    const filteredCountries = search
        ? COUNTRIES.filter(
            c =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.dial.includes(search) ||
                c.code.toLowerCase().includes(search.toLowerCase())
        )
        : COUNTRIES

    return (
        <div className={cn("relative flex items-center gap-0", className)}>
            {/* Country selector button */}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 h-11 px-2.5 rounded-l-md border border-r-0 border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white shrink-0 disabled:opacity-50"
                aria-label="Selecionar país"
                aria-expanded={isOpen}
            >
                <span className="text-lg leading-none">{selectedCountry.flag}</span>
                <span className="text-xs text-gray-400 font-mono">{selectedCountry.dial}</span>
                <ChevronDown className={cn("h-3 w-3 text-gray-500 transition-transform", isOpen && "rotate-180")} />
            </button>

            {/* Phone number input */}
            <input
                id={id}
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={disabled}
                placeholder="Número do telefone"
                className="flex-1 h-11 rounded-r-md border border-white/10 bg-white/5 px-3 text-white text-base placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50"
            />

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-1 w-72 max-h-64 z-50 rounded-lg border border-white/10 bg-[#1a1a2e] shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
                >
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5">
                        <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar país..."
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
                        />
                    </div>

                    {/* Country list */}
                    <div className="overflow-y-auto max-h-52 overscroll-contain">
                        {filteredCountries.length === 0 ? (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                                Nenhum país encontrado
                            </div>
                        ) : (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country)}
                                    className={cn(
                                        "flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-white/10 transition-colors",
                                        selectedCountry.code === country.code && "bg-blue-500/10 text-blue-300"
                                    )}
                                >
                                    <span className="text-lg leading-none">{country.flag}</span>
                                    <span className="flex-1 text-sm text-gray-200 truncate">{country.name}</span>
                                    <span className="text-xs text-gray-500 font-mono">{country.dial}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
