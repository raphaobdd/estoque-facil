import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { nomeNegocio, segmento, nomeResponsavel, userId, email } = await request.json()

    // Usar a chave service_role para ignorar RLS na criação inicial (admin)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Criar empresa
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from('empresas')
      .insert({ nome: nomeNegocio, segmento })
      .select()
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 })
    }

    // Criar perfil do usuário
    const { error: perfilError } = await supabaseAdmin
      .from('perfis')
      .insert({
        id: userId,
        empresa_id: empresa.id,
        nome: nomeResponsavel,
        email,
        perfil: 'admin',
      })

    if (perfilError) {
      return NextResponse.json({ error: 'Erro ao criar perfil' }, { status: 500 })
    }

    // Criar categorias padrão
    const categoriasPadrao = [
      'Alimentos', 'Bebidas', 'Limpeza', 'Higiene',
      'Papelaria', 'Eletrônicos', 'Vestuário', 'Outros'
    ]

    await supabaseAdmin.from('categorias').insert(
      categoriasPadrao.map(nome => ({ empresa_id: empresa.id, nome }))
    )

    return NextResponse.json({ success: true, empresaId: empresa.id })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
