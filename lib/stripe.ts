import Stripe from 'stripe'

// Lazy initialization — evita erro durante o build (env var não disponível em build time)
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY não configurada')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-06-24.dahlia',
    })
  }
  return _stripe
}

// Mantém export nomeado para compatibilidade
export { getStripe as stripe }

export const PLANOS = {
  basic: {
    priceId: process.env.STRIPE_BASIC_PRICE_ID ?? '',
    nome: 'Basic',
    preco: 29.90,
    limiteProdutos: 10,
  },
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? '',
    nome: 'Starter',
    preco: 59.90,
    limiteProdutos: 50,
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
    nome: 'Pro',
    preco: 99.90,
    limiteProdutos: Infinity,
  },
} as const

export type PlanoKey = keyof typeof PLANOS
