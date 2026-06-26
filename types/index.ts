export type Perfil = 'admin' | 'operador' | 'visualizador'
export type UnidadeMedida = 'unidade' | 'caixa' | 'pacote' | 'quilo' | 'grama' | 'litro' | 'metro'
export type TipoMovimentacao = 'entrada' | 'saida' | 'perda' | 'ajuste'
export type TipoAlerta = 'reposicao' | 'validade' | 'parado' | 'perda'
export type StatusAlerta = 'ativo' | 'ignorado' | 'resolvido'
export type ClassificacaoGiro = 'alto' | 'normal' | 'baixo' | 'parado'
export type PlanoStatus = 'trial' | 'ativo' | 'cancelado' | 'expirado'
export type PlanoKey = 'basic' | 'starter' | 'pro'

export interface Empresa {
  id: string
  nome: string
  segmento: string | null
  plano: string
  plano_status: PlanoStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_expira_em: string
  criado_em: string
}

export interface PerfilUsuario {
  id: string
  empresa_id: string | null
  nome: string
  email: string
  perfil: Perfil
  ativo: boolean
  onboarding_completo: boolean
  criado_em: string
}

export interface Categoria {
  id: string
  empresa_id: string
  nome: string
  ativa: boolean
  criado_em: string
}

export interface Produto {
  id: string
  empresa_id: string
  categoria_id: string | null
  nome: string
  unidade_medida: UnidadeMedida
  codigo_interno: string | null
  foto_url: string | null
  estoque_atual: number
  estoque_minimo: number
  custo_unitario: number | null
  preco_venda: number | null
  fornecedor: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
  // joins
  categoria?: Categoria
}

export interface Movimentacao {
  id: string
  empresa_id: string
  produto_id: string
  usuario_id: string
  tipo: TipoMovimentacao
  quantidade: number
  estoque_anterior: number
  estoque_posterior: number
  motivo: string | null
  observacao: string | null
  foto_url: string | null
  custo_unitario_momento: number | null
  data_movimentacao: string
  criado_em: string
  // joins
  produto?: Produto
  usuario?: PerfilUsuario
}

export interface LoteValidade {
  id: string
  empresa_id: string
  produto_id: string
  movimentacao_id: string | null
  quantidade: number
  data_validade: string | null
  codigo_lote: string | null
  ativo: boolean
  criado_em: string
  produto?: Produto
}

export interface Alerta {
  id: string
  empresa_id: string
  produto_id: string | null
  tipo: TipoAlerta
  mensagem: string
  status: StatusAlerta
  criado_em: string
  resolvido_em: string | null
  produto?: Produto
}

export interface DashboardStats {
  produtosParaRepor: number
  produtosParados: number
  perdasMes: { quantidade: number; valor: number }
  estoqueTotal: { itens: number; valor: number }
}

export interface ProdutoGiro extends Produto {
  totalSaidas: number
  diasSemSaida: number
  classificacao: ClassificacaoGiro
  sugestao: string
}
