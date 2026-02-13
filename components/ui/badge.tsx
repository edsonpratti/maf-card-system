import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                // Variantes semânticas
                success:
                    "border-transparent bg-green-500 text-white hover:bg-green-600",
                warning:
                    "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
                info:
                    "border-transparent bg-blue-500 text-white hover:bg-blue-600",
                // Variantes outline semânticas
                "outline-success":
                    "border-green-500 text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
                "outline-warning":
                    "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400",
                "outline-destructive":
                    "border-red-500 text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
                "outline-info":
                    "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
