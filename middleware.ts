import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isPublicPath(pathname: string) {
  return (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/security' ||
    pathname === '/lp' ||
    pathname.startsWith('/lp/') ||
    pathname === '/free-minutes' ||
    pathname === '/api/contact' ||
    pathname === '/api/auth/signup' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/demo' ||
    pathname === '/api/invitations/accept' ||
    pathname === '/api/stripe/webhook' ||
    pathname === '/trial-expired' ||
    pathname === '/join' ||
    pathname === '/help' ||
    pathname === '/promo' ||
    pathname === '/promo/logo' ||
    pathname.endsWith('.html') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/blog' ||
    pathname.startsWith('/blog/')
  )
}

function isStaticPath(pathname: string) {
  return (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/_next/webpack-hmr') ||
    pathname === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|html)$/.test(pathname)
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isStaticPath(pathname)) {
    return NextResponse.next({
      request,
    })
  }

  const isLoginPage = isPublicPath(pathname)

  if (isLoginPage) {
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    // ルートアクセスは未ログインならLPへ
    url.pathname = pathname === '/' ? '/lp' : '/login'
    return NextResponse.redirect(url)
  }

  // トライアル期限チェック（期限切れページ・決済・APIは除外）
  if (
    pathname !== '/trial-expired' &&
    !pathname.startsWith('/api/stripe') &&
    !pathname.startsWith('/settings/billing') &&
    !pathname.startsWith('/api/')
  ) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profile?.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('plan, trial_ends_at')
        .eq('id', profile.company_id)
        .single()

      if (
        company?.plan === 'trial' &&
        company?.trial_ends_at &&
        new Date(company.trial_ends_at) < new Date()
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/trial-expired'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}