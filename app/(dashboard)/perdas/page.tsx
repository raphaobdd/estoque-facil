import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerdasClient from './PerdasClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Perdas' }

export default async function PerdasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfis').select('empresa_id').eq('id', user.id).single()
  if (!perfil?.empresa_id) redirect('/onboarding')
  const eid = perfil.empresa_id

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0]
  const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString().split('T')[0]

  const [{ data: perdasMes }, { data: perdasMesAnterior }, { data: perdasDetalhe }] = await Promise.all([
    supabase.from('movimentacoes').select('produto_id, quantidade, custo_unitario_momento, motivo, data_movimentacao')
      .eq('empresa_id', eid).eq('tipo', 'perda').gte('data_movimentacao', inicioMes),
    supabase.from('movimentacoes').select('quantidade, custo_unitario_momento')
      .eq('empresa_id', eid).eq('tipo', 'perda')
      .gte('data_movimentacao', inicioMesAnterior).lte('data_movimentacao', fimMesAnterior),
    supabase.from('movimentacoes')
      .select('id, quantidade, custo_unitario_momento, motivo, observacao, data_movimentacao, produto:produtos(id, nome, unidade_medida)')
      .eq('empresa_id', eid).eq('tipo', 'perda')
      .order('data_movimentacao', { ascending: false })
      .limit(50),
  ])

  return (
    <PerdasClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      perdasMes={(perdasMes ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      perdasMesAnterior={(perdasMesAnterior ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      perdasDetalhe={(perdasDetalhe ?? []) as any}
    />
  )
}
