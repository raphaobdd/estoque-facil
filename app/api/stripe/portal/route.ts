import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: perfil } = await supabase
      .from('perfis')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('stripe_customer_id')
      .eq('id', perfil.empresa_id)
      .single()

    if (!empresa?.stripe_customer_id) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa' }, { status: 404 })
    }

    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    const portalSession = await stripe().billingPortal.sessions.create({
      customer: empresa.stripe_customer_id,
      return_url: `${origin}/configuracoes`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err) {
    console.error('[portal]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
