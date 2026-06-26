import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RelatoriosClient from './RelatoriosClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Relatórios' }

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfis').select('empresa_id, empresa:empresas(nome)').eq('id', user.id).single()
  if (!perfil?.empresa_id) redirect('/onboarding')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const empresa = perfil.empresa as any
  const nomeEmpresa = (Array.isArray(empresa) ? empresa[0]?.nome : empresa?.nome) ?? 'Minha empresa'

  return (
    <RelatoriosClient
      empresaId={perfil.empresa_id}
      nomeEmpresa={nomeEmpresa}
    />
  )
}
