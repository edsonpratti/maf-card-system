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
        <div className="space-y-3">
            {options.map((option, index) => {
                const isSelected = value.includes(option)
                return (
                    <div
                        key={index}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                        onClick={() => toggleOption(option)}
                    >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                            }`}>
                            {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                            )}
                        </div>
                        <Label className="cursor-pointer flex-1 text-base">
                            {option}
                        </Label>
                    </div>
                )
            })}
        </div>
    )
}
