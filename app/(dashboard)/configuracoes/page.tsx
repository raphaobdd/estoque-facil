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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const empresa = Array.isArray((perfil as any).empresa)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (perfil as any).empresa[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (perfil as any).empresa

  return (
    <ConfiguracoesClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      perfil={perfil as any}
      userId={user.id}
      planoStatus={empresa?.plano_status ?? 'trial'}
      plano={empresa?.plano ?? 'trial'}
      trialExpiraEm={empresa?.trial_expira_em ?? null}
    />
  )
}
