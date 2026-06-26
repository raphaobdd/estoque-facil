import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('*, empresa:empresas(*)')
    .eq('id', user.id)
    .single()

  if (!perfil?.empresa_id) redirect('/onboarding')

  // Contar alertas ativos
  const { count: alertasAtivos } = await supabase
    .from('alertas')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'ativo')

  const nomeEmpresa = (perfil.empresa as { nome: string } | null)?.nome ?? 'Minha empresa'

  return (
    <div className="dashboard-layout">
      <Sidebar
        nomeEmpresa={nomeEmpresa}
        nomeUsuario={perfil.nome}
        alertasAtivos={alertasAtivos ?? 0}
      />
      <main className="dashboard-main">
        <div className="page-container">
          {children}
        </div>
      </main>
      <BottomNav alertasAtivos={alertasAtivos ?? 0} />
    </div>
  )
}
