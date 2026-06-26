import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/cadastro')
  const isCallbackRoute = url.pathname.startsWith('/auth/callback')
  const isPublicRoute = url.pathname === '/'
  const isStripeApiRoute = url.pathname.startsWith('/api/stripe')
  const isConfiguracoesRoute = url.pathname.startsWith('/configuracoes')

  if (!user && !isAuthRoute && !isCallbackRoute && !isPublicRoute && !isStripeApiRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Feature Gating: se estiver logado, checa se a assinatura expirou
  if (user && !isAuthRoute && !isCallbackRoute && !isPublicRoute && !isConfiguracoesRoute && !isStripeApiRoute) {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (perfil?.empresa_id) {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('plano_status, trial_expira_em')
        .eq('id', perfil.empresa_id)
        .single()

      if (empresa) {
        let expirado = empresa.plano_status === 'cancelado' || empresa.plano_status === 'expirado'
        
        // Verifica se trial expirou
        if (empresa.plano_status === 'trial' && empresa.trial_expira_em) {
          const trialFim = new Date(empresa.trial_expira_em).getTime()
          if (Date.now() > trialFim) {
            expirado = true
            // OPCIONAL: Atualizar o status para expirado aqui, ou apenas bloquear o acesso
          }
        }

        if (expirado) {
          url.pathname = '/configuracoes'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}
