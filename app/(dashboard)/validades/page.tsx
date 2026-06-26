import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ValidadesClient from './ValidadesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Validades' }

export default async function ValidadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfis').select('empresa_id').eq('id', user.id).single()
  if (!perfil?.empresa_id) redirect('/onboarding')

  const { data: lotes } = await supabase
    .from('lotes_validade')
    .select('*, produto:produtos(id, nome, unidade_medida, categoria:categorias(nome))')
    .eq('empresa_id', perfil.empresa_id)
    .eq('ativo', true)
    .not('data_validade', 'is', null)
    .order('data_validade', { ascending: true })

  return <ValidadesClient lotes={lotes ?? []} empresaId={perfil.empresa_id} />
}
