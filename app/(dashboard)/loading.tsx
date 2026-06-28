import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', width: '100%', gap: 'var(--space-4)' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
        Carregando...
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
