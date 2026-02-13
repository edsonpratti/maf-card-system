'use client'

import { Label } from '@/components/ui/label'

interface MultipleChoiceQuestionProps {
    options: string[]
    value: string
    onChange: (value: string) => void
}

export default function MultipleChoiceQuestion({ options, value, onChange }: MultipleChoiceQuestionProps) {
    return (
        <div className="space-y-2 sm:space-y-3">
            {options.map((option, index) => (
                <div
                    key={index}
                    className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 border-2 rounded-lg cursor-pointer transition-all active:scale-[0.98] ${value === option
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                    onClick={() => onChange(option)}
                >
                    <div className={`w-5 h-5 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${value === option ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                        {value === option && (
                            <div className="w-3 h-3 sm:w-3 sm:h-3 rounded-full bg-primary" />
                        )}
                    </div>
                    <Label className="cursor-pointer flex-1 text-sm sm:text-base leading-relaxed">
                        {option}
                    </Label>
                </div>
            ))}
        </div>
    )
}
