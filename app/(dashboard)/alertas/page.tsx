import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlertasClient from './AlertasClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Alertas' }

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfis').select('empresa_id').eq('id', user.id).single()
  if (!perfil?.empresa_id) redirect('/onboarding')

  const { data: alertas } = await supabase
    .from('alertas')
    .select('*, produto:produtos(id, nome, estoque_atual, estoque_minimo, unidade_medida, custo_unitario)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'ativo')
    .order('criado_em', { ascending: false })

  return (
    <AlertasClient
      alertas={alertas ?? []}
      empresaId={perfil.empresa_id}
    />
  )
}
