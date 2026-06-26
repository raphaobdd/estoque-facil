'use client'

import { useMemo, useState } from 'react'
import { Calendar, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { calcularDiasValidade, formatDate } from '@/lib/utils'

interface LoteDetalhe {
  id: string
  empresa_id: string
  produto_id: string
  movimentacao_id: string | null
  quantidade: number
  data_validade: string | null
  codigo_lote: string | null
  ativo: boolean
  criado_em: string
  produto?: { id: string; nome: string; unidade_medida: string; categoria?: { nome: string } | null } | null
}

interface Props { lotes: LoteDetalhe[]; empresaId: string }

type StatusValidade = 'vencido' | 'critico' | 'atencao' | 'ok'
type FiltroValidade = 'todos' | StatusValidade

function getStatus(dias: number | null): StatusValidade {
  if (dias === null) return 'ok'
  if (dias < 0) return 'vencido'
  if (dias <= 7) return 'critico'
  if (dias <= 15) return 'atencao'
  return 'ok'
}

const STATUS_CONFIG = {
  vencido: { label: 'Vencido', color: 'var(--color-danger)', bg: 'var(--color-danger-light)', icon: <XCircle size={16} /> },
  critico: { label: 'Vence em 7 dias', color: 'var(--color-danger)', bg: 'var(--color-danger-light)', icon: <AlertTriangle size={16} /> },
  atencao: { label: 'Vence em 15 dias', color: 'var(--color-warning)', bg: 'var(--color-warning-light)', icon: <Clock size={16} /> },
  ok: { label: 'OK', color: 'var(--color-success)', bg: 'var(--color-success-light)', icon: <Calendar size={16} /> },
}

export default function ValidadesClient({ lotes }: Props) {
  const [filtro, setFiltro] = useState<FiltroValidade>('todos')

  const lotesComStatus = useMemo(() => {
    return lotes.map(l => {
      const dias = calcularDiasValidade(l.data_validade)
      return { ...l, dias, status: getStatus(dias) }
    })
  }, [lotes])

  const contadores = {
    todos: lotesComStatus.length,
    vencido: lotesComStatus.filter(l => l.status === 'vencido').length,
    critico: lotesComStatus.filter(l => l.status === 'critico').length,
    atencao: lotesComStatus.filter(l => l.status === 'atencao').length,
    ok: lotesComStatus.filter(l => l.status === 'ok').length,
  }

  const lotesFiltrados = filtro === 'todos' ? lotesComStatus : lotesComStatus.filter(l => l.status === filtro)

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Validades</h1>
        <p className="page-subtitle">Acompanhe os produtos que vencerão em breve.</p>
      </div>

      {/* Alerta crítico */}
      {(contadores.vencido > 0 || contadores.critico > 0) && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-5)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>
            {contadores.vencido > 0 && <><strong>{contadores.vencido}</strong> {contadores.vencido === 1 ? 'lote vencido' : 'lotes vencidos'}. </>}
            {contadores.critico > 0 && <><strong>{contadores.critico}</strong> {contadores.critico === 1 ? 'lote vence' : 'lotes vencem'} nos próximos 7 dias.</>}
          </span>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {(['todos', 'vencido', 'critico', 'atencao', 'ok'] as FiltroValidade[]).map(f => {
          const cfg = f !== 'todos' ? STATUS_CONFIG[f as keyof typeof STATUS_CONFIG] : null
          return (
            <button
              key={f}
              className={`btn btn-sm ${filtro === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltro(f)}
            >
              {f === 'todos' ? 'Todos' : cfg?.label} ({contadores[f]})
            </button>
          )
        })}
      </div>

      <div className="table-container">
        {lotesFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Calendar size={28} /></div>
            <p className="empty-state-title">Nenhum lote encontrado</p>
            <p className="empty-state-desc">
              {filtro === 'todos'
                ? 'Cadastre datas de validade nas entradas para acompanhar aqui.'
                : 'Nenhum lote neste status.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Quantidade</th>
                  <th>Vencimento</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {lotesFiltrados.map(l => {
                  const cfg = STATUS_CONFIG[l.status]
                  return (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.produto?.nome ?? '—'}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{l.produto?.categoria?.nome ?? '—'}</td>
                      <td>{l.quantidade} {l.produto?.unidade_medida ?? ''}</td>
                      <td style={{ fontWeight: 500, color: l.status === 'vencido' ? 'var(--color-danger)' : 'var(--color-text)' }}>
                        {formatDate(l.data_validade)}
                      </td>
                      <td>
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {cfg.icon}
                          {l.status === 'vencido' ? 'Vencido' :
                            l.dias !== null ? `${l.dias}d` : cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
