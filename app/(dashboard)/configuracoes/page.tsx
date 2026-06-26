import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfiguracoesClient from './ConfiguracoesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configurações' }

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('*, empresa:empresas(*)')
    .eq('id', user.id)
    .single()

  if (!perfil?.empresa_id) redirect('/onboarding')

  return (
    <ConfiguracoesClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      perfil={perfil as any}
      userId={user.id}
    />
  )
}
