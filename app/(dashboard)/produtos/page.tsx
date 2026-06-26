import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProdutosClient from './ProdutosClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Produtos' }

export default async function ProdutosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfis').select('empresa_id, perfil').eq('id', user.id).single()
  if (!perfil?.empresa_id) redirect('/onboarding')

  const { data: produtos } = await supabase
    .from('produtos')
    .select('*, categoria:categorias(id, nome)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('ativo', true)
    .order('nome')

  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .eq('ativa', true)
    .order('nome')

  return (
    <ProdutosClient
      produtosIniciais={produtos ?? []}
      categorias={categorias ?? []}
      empresaId={perfil.empresa_id}
      userId={user.id}
      userPerfil={perfil.perfil}
    />
  )
}
