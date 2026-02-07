import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rotas /portal (exige autenticação de aluna)
  if (request.nextUrl.pathname.startsWith('/portal')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Se for admin, permitir acesso ao portal também
    return response
  }

  // Proteger rotas /admin (exceto /admin/login)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Permitir acesso à página de login sem autenticação
    if (request.nextUrl.pathname === '/admin/login') {
      // Se já está autenticado e é admin, redirecionar para dashboard
      if (user && (user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true)) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return response
    }

    // Para outras rotas /admin, verificar autenticação
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Verificar se o usuário tem permissão de admin
    const isAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
    if (!isAdmin) {
      // Usuário autenticado mas não é admin - redirecionar para página principal
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
