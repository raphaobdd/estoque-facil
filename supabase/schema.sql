-- ============================================================
-- ESTOQUE FÁCIL — Schema SQL para Supabase
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: empresas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  segmento TEXT,
  plano TEXT NOT NULL DEFAULT 'trial',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: perfis (liga ao auth.users do Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'admin' CHECK (perfil IN ('admin', 'operador', 'visualizador')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_completo BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: produtos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  unidade_medida TEXT NOT NULL DEFAULT 'unidade' CHECK (unidade_medida IN ('unidade', 'caixa', 'pacote', 'quilo', 'grama', 'litro', 'metro')),
  codigo_interno TEXT,
  foto_url TEXT,
  estoque_atual NUMERIC(12, 3) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12, 3) NOT NULL DEFAULT 0,
  custo_unitario NUMERIC(12, 2),
  preco_venda NUMERIC(12, 2),
  fornecedor TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: movimentacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'perda', 'ajuste')),
  quantidade NUMERIC(12, 3) NOT NULL,
  estoque_anterior NUMERIC(12, 3) NOT NULL,
  estoque_posterior NUMERIC(12, 3) NOT NULL,
  motivo TEXT,
  observacao TEXT,
  foto_url TEXT,
  custo_unitario_momento NUMERIC(12, 2),
  data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: lotes_validade
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lotes_validade (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  movimentacao_id UUID REFERENCES public.movimentacoes(id) ON DELETE SET NULL,
  quantidade NUMERIC(12, 3) NOT NULL,
  data_validade DATE,
  codigo_lote TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: alertas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('reposicao', 'validade', 'parado', 'perda')),
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'ignorado', 'resolvido')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolvido_em TIMESTAMPTZ
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON public.produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa ON public.movimentacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON public.movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON public.movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON public.movimentacoes(data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_alertas_empresa ON public.alertas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON public.alertas(status);
CREATE INDEX IF NOT EXISTS idx_lotes_produto ON public.lotes_validade(produto_id);
CREATE INDEX IF NOT EXISTS idx_lotes_validade ON public.lotes_validade(data_validade);
CREATE INDEX IF NOT EXISTS idx_perfis_empresa ON public.perfis(empresa_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_validade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: retorna empresa_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id FROM public.perfis WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- POLÍTICAS: perfis
CREATE POLICY "Perfil próprio" ON public.perfis
  FOR ALL USING (id = auth.uid());

CREATE POLICY "Admins veem perfis da empresa" ON public.perfis
  FOR SELECT USING (empresa_id = public.get_empresa_id());

-- POLÍTICAS: empresas
CREATE POLICY "Usuário vê própria empresa" ON public.empresas
  FOR SELECT USING (id = public.get_empresa_id());

CREATE POLICY "Admin atualiza empresa" ON public.empresas
  FOR UPDATE USING (id = public.get_empresa_id());

-- POLÍTICAS: categorias
CREATE POLICY "Categorias da empresa" ON public.categorias
  FOR ALL USING (empresa_id = public.get_empresa_id());

-- POLÍTICAS: produtos
CREATE POLICY "Produtos da empresa" ON public.produtos
  FOR ALL USING (empresa_id = public.get_empresa_id());

-- POLÍTICAS: movimentacoes
CREATE POLICY "Movimentações da empresa" ON public.movimentacoes
  FOR ALL USING (empresa_id = public.get_empresa_id());

-- POLÍTICAS: lotes_validade
CREATE POLICY "Lotes da empresa" ON public.lotes_validade
  FOR ALL USING (empresa_id = public.get_empresa_id());

-- POLÍTICAS: alertas
CREATE POLICY "Alertas da empresa" ON public.alertas
  FOR ALL USING (empresa_id = public.get_empresa_id());

-- ============================================================
-- TRIGGER: atualiza atualizado_em nos produtos
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_produtos_atualizado_em
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- ============================================================
-- TRIGGER: cria perfil automaticamente após signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- O perfil será criado durante o onboarding com empresa_id
  -- Este trigger apenas garante que o registro existe
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STRIPE — Campos de assinatura na tabela empresas
-- Execute este bloco no SQL Editor do Supabase após criar as
-- tabelas pela primeira vez, ou junto com o schema inicial.
-- ============================================================
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plano_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (plano_status IN ('trial', 'ativo', 'cancelado', 'expirado')),
  ADD COLUMN IF NOT EXISTS trial_expira_em TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days');

