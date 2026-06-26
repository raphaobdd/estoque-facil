import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MovimentarClient from './MovimentarClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Movimentar Estoque' }

export default async function MovimentarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfis').select('empresa_id, perfil').eq('id', user.id).single()
  if (!perfil?.empresa_id) redirect('/onboarding')

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, nome, estoque_atual, estoque_minimo, unidade_medida, custo_unitario, categoria:categorias(nome)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('ativo', true)
    .order('nome')

  return (
    <MovimentarClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      produtos={(produtos ?? []) as any}
      empresaId={perfil.empresa_id}
      userId={user.id}
    />
  )
}
