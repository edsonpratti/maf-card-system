'use client'

import { Button } from '@/components/ui/button'

interface LinearScaleQuestionProps {
    min: number
    max: number
    minLabel?: string
    maxLabel?: string
    value: number | null
    onChange: (value: number) => void
}

export default function LinearScaleQuestion({
    min,
    max,
    minLabel,
    maxLabel,
    value,
    onChange
}: LinearScaleQuestionProps) {
    const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                {values.map((val) => (
                    <Button
                        key={val}
                        type="button"
                        variant={value === val ? 'default' : 'outline'}
                        className="flex-1 min-w-[40px] sm:min-w-[50px] h-11 sm:h-14 text-base sm:text-lg font-semibold"
                        onClick={() => onChange(val)}
                    >
                        {val}
                    </Button>
                ))}
            </div>
            {(minLabel || maxLabel) && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground px-1">
                    <span>{minLabel || ''}</span>
                    <span>{maxLabel || ''}</span>
                </div>
            )}
        </div>
    )
}
