import { Produto, Movimentacao, DashboardStats, ProdutoGiro, ClassificacaoGiro } from '@/types'

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr + 'T00:00:00'))
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
}

export function formatQuantidade(value: number, unidade: string): string {
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/\.?0+$/, '')
  return `${formatted} ${unidade}`
}

export function calcularSugestaoCompra(estoqueMinimo: number, estoqueAtual: number): number {
  const sugestao = (estoqueMinimo * 2) - estoqueAtual
  return Math.max(0, Math.ceil(sugestao))
}

export function calcularClassificacaoGiro(totalSaidas: number, diasSemSaida: number, dias: number): ClassificacaoGiro {
  if (diasSemSaida >= 30) return 'parado'
  const mediaDiaria = totalSaidas / dias
  if (mediaDiaria >= 1) return 'alto'
  if (mediaDiaria >= 0.2) return 'normal'
  return 'baixo'
}

export function gerarSugestaoGiro(produto: Produto, classificacao: ClassificacaoGiro, diasSemSaida: number): string {
  switch (classificacao) {
    case 'alto':
      if (produto.estoque_atual <= produto.estoque_minimo) {
        return 'Produto com estoque baixo e giro alto. Reposição recomendada.'
      }
      return 'Produto com giro alto. Considere aumentar o estoque mínimo.'
    case 'normal':
      return 'Produto com movimentação regular. Estoque saudável.'
    case 'baixo':
      return 'Produto com poucas saídas. Avalie reduzir o volume de compra.'
    case 'parado':
      return `Produto parado há ${diasSemSaida} dias. Avalie promoção, desconto ou redução de compra.`
  }
}

export function calcularDiasValidade(dataValidade: string | null): number | null {
  if (!dataValidade) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const validade = new Date(dataValidade + 'T00:00:00')
  const diff = validade.getTime() - hoje.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(';'),
    ...data.map(row => headers.map(h => {
      const val = row[h]
      const str = val === null || val === undefined ? '' : String(val)
      return str.includes(';') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
    }).join(';'))
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`
}
