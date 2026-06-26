import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Configuração de webhook inválida' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] Assinatura inválida:', err)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any
        const empresaId = session.metadata?.empresa_id
        const plano = session.metadata?.plano
        const subscriptionId = session.subscription as string

        if (empresaId && plano) {
          await supabaseAdmin
            .from('empresas')
            .update({
              plano,
              plano_status: 'ativo',
              stripe_subscription_id: subscriptionId,
            })
            .eq('id', empresaId)
        }
        break
      }

      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any
        const empresaId = sub.metadata?.empresa_id
        const plano = sub.metadata?.plano

        if (empresaId) {
          const status = sub.status === 'active' ? 'ativo'
            : sub.status === 'canceled' ? 'cancelado'
            : sub.status === 'past_due' ? 'expirado'
            : 'expirado'

          await supabaseAdmin
            .from('empresas')
            .update({ plano_status: status, plano: plano ?? 'trial' })
            .eq('id', empresaId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any
        const empresaId = sub.metadata?.empresa_id

        if (empresaId) {
          await supabaseAdmin
            .from('empresas')
            .update({
              plano: 'trial',
              plano_status: 'cancelado',
              stripe_subscription_id: null,
            })
            .eq('id', empresaId)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook] Erro ao processar:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
