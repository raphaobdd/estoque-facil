import { stripe, PLANOS, PlanoKey } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { plano } = await request.json() as { plano: PlanoKey }

    if (!PLANOS[plano]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

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
      .select('stripe_customer_id, nome')
      .eq('id', perfil.empresa_id)
      .single()

    // Buscar ou criar customer no Stripe
    let customerId = empresa?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe().customers.create({
        email: user.email,
        name: empresa?.nome ?? undefined,
        metadata: { empresa_id: perfil.empresa_id, user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('empresas')
        .update({ stripe_customer_id: customerId })
        .eq('id', perfil.empresa_id)
    }

    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    const session = await stripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANOS[plano].priceId, quantity: 1 }],
      success_url: `${origin}/configuracoes?checkout=success`,
      cancel_url: `${origin}/configuracoes?checkout=cancelled`,
      metadata: { empresa_id: perfil.empresa_id, plano },
      subscription_data: {
        metadata: { empresa_id: perfil.empresa_id, plano },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
