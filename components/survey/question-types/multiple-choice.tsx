'use client'

import { Label } from '@/components/ui/label'

interface MultipleChoiceQuestionProps {
    options: string[]
    value: string
    onChange: (value: string) => void
}

export default function MultipleChoiceQuestion({ options, value, onChange }: MultipleChoiceQuestionProps) {
    return (
        <div className="space-y-3">
            {options.map((option, index) => (
                <div
                    key={index}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${value === option
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                    onClick={() => onChange(option)}
                >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${value === option ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                        {value === option && (
                            <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                    </div>
                    <Label className="cursor-pointer flex-1 text-base">
                        {option}
                    </Label>
                </div>
            ))}
        </div>
    )
}
