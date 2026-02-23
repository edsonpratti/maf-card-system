import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicPaths = [
    '/solicitar',
    '/primeiro-acesso',
    '/recuperar-senha',
    '/admin/recuperar-senha',
    '/validar',
    '/enquete',
    '/api/public'
  ]

  // Verificar se a rota é pública
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Se for rota pública, apenas retornar sem verificar autenticação
  if (isPublicPath) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirecionar usuários autenticados da home para o portal
  if (request.nextUrl.pathname === '/') {
    if (user) {
      const isAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
    }
  }

  // Redirecionar usuários autenticados da página de login para o portal
  if (request.nextUrl.pathname === '/login') {
    if (user) {
      const isAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
    }
  }

  // Proteger rotas /portal (exige autenticação de aluna)
  if (request.nextUrl.pathname.startsWith('/portal')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar acesso ao MAF Pro ID para rotas específicas
    if (request.nextUrl.pathname.startsWith('/portal/carteira-profissional')) {
      // Reutilizar o mesmo cliente supabase já criado acima
      const { data: userCard } = await supabase
        .from('users_cards')
        .select('maf_pro_id_approved')
        .eq('auth_user_id', user.id)
        .single()

      // Se não tem aprovação do MAF Pro ID, redirecionar para página de pendência
      if (!userCard?.maf_pro_id_approved) {
        return NextResponse.redirect(new URL('/portal/pendente-aprovacao', request.url))
      }
    }

    // Se for admin, permitir acesso ao portal também
    return response
  }

  // Proteger rotas /admin (exceto /admin/login e /admin/verify-2fa)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Permitir acesso às páginas de login e verificação 2FA sem autenticação
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin/verify-2fa') {
      // Se já está autenticado e é admin, redirecionar para dashboard (exceto na verificação 2FA)
      if (user && (user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true)) {
        // Não redirecionar se estiver na página de verificação 2FA
        if (request.nextUrl.pathname !== '/admin/verify-2fa') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
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
