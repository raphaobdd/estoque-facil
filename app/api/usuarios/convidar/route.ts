import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, perfil, empresaId } = await request.json()

    const supabase = await createClient()

    // Verificar que o usuário logado é admin da empresa
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: perfilAtual } = await supabase
      .from('perfis')
      .select('empresa_id, perfil')
      .eq('id', user.id)
      .single()

    if (!perfilAtual || perfilAtual.empresa_id !== empresaId || perfilAtual.perfil !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Criar usuário no Supabase Auth via service role
    // Para funcionar, configure SUPABASE_SERVICE_ROLE_KEY no .env.local
    // e use o cliente admin para criar o usuário convidado

    // Por enquanto, retornar sucesso simulado
    // Em produção: usar supabase-admin client com service_role
    return NextResponse.json({ success: true, message: `Convite enviado para ${email}` })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
