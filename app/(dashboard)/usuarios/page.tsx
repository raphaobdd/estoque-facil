import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsuariosClient from './UsuariosClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Usuários' }

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfis').select('empresa_id, perfil').eq('id', user.id).single()
  if (!perfil?.empresa_id || perfil.perfil !== 'admin') redirect('/dashboard')

  const { data: usuarios } = await supabase
    .from('perfis')
    .select('id, nome, email, perfil, ativo, criado_em')
    .eq('empresa_id', perfil.empresa_id)
    .order('criado_em')

  return (
    <UsuariosClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usuarios={(usuarios ?? []) as any}
      empresaId={perfil.empresa_id}
      currentUserId={user.id}
    />
  )
}
