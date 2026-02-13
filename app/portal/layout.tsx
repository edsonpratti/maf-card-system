import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Home, Menu } from "lucide-react"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  async function signOut() {
    'use server'
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-50">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/portal" className="flex items-center gap-2 font-bold text-lg sm:text-xl">
              <Home className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">MAF Pro</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline truncate max-w-[200px]">
              {user.email}
            </span>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit" className="h-8 sm:h-9 px-2 sm:px-3">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-4 sm:py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-3 sm:gap-4 md:h-16 md:flex-row px-4 sm:px-6">
          <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
            © 2024 MAF Pro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
