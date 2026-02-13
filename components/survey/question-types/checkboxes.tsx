'use client'

import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'

interface CheckboxesQuestionProps {
    options: string[]
    value: string[]
    onChange: (value: string[]) => void
}

export default function CheckboxesQuestion({ options, value, onChange }: CheckboxesQuestionProps) {
    const toggleOption = (option: string) => {
        if (value.includes(option)) {
            onChange(value.filter(v => v !== option))
        } else {
            onChange([...value, option])
        }
    }

    return (
        <div className="space-y-2 sm:space-y-3">
            {options.map((option, index) => {
                const isSelected = value.includes(option)
                return (
                    <div
                        key={index}
                        className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 border-2 rounded-lg cursor-pointer transition-all active:scale-[0.98] ${isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                        onClick={() => toggleOption(option)}
                    >
                        <div className={`w-5 h-5 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                            }`}>
                            {isSelected && (
                                <Check className="w-3 h-3 sm:w-3 sm:h-3 text-white" />
                            )}
                        </div>
                        <Label className="cursor-pointer flex-1 text-sm sm:text-base leading-relaxed">
                            {option}
                        </Label>
                    </div>
                )
            })}
        </div>
    )
}
