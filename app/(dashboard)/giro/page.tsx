import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GiroClient from './GiroClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Giro de Produtos' }

export default async function GiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfis').select('empresa_id').eq('id', user.id).single()
  if (!perfil?.empresa_id) redirect('/onboarding')
  const eid = perfil.empresa_id

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, nome, estoque_atual, estoque_minimo, unidade_medida, custo_unitario, categoria:categorias(nome)')
    .eq('empresa_id', eid)
    .eq('ativo', true)
    .order('nome')

  const trinta = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: movimentos } = await supabase
    .from('movimentacoes')
    .select('produto_id, quantidade, data_movimentacao')
    .eq('empresa_id', eid)
    .in('tipo', ['saida', 'perda'])
    .gte('data_movimentacao', trinta)

  return (
    <GiroClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      produtos={(produtos ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      movimentos={(movimentos ?? []) as any}
    />
  )
}
