"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

interface MobileNavProps {
    links?: { href: string; label: string; hasSubmenu?: boolean }[]
    ctaLabel?: string
    ctaHref?: string
}

export function MobileNav({ 
    links = [
        { href: "/", label: "Home" },
        { href: "#recursos", label: "Recursos", hasSubmenu: true },
        { href: "#sobre", label: "Sobre", hasSubmenu: true },
        { href: "#metodo", label: "Método", hasSubmenu: true },
        { href: "#contato", label: "Contato" },
    ],
    ctaLabel = "Acessar Portal",
    ctaHref = "/login"
}: MobileNavProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Menu className="w-6 h-6" />
                    <span className="sr-only">Abrir menu</span>
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80 bg-[#0a1628] border-white/10">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-white">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">M</span>
                        </div>
                        MAF Pro
                    </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-8">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <span className="font-medium">{link.label}</span>
                            {link.hasSubmenu && <ChevronDown className="w-4 h-4" />}
                        </Link>
                    ))}
                    <div className="border-t border-white/10 my-4" />
                    <Button
                        onClick={() => {
                            setOpen(false)
                            router.push(ctaHref)
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-full"
                    >
                        {ctaLabel}
                    </Button>
                </nav>
            </SheetContent>
        </Sheet>
    )
}
