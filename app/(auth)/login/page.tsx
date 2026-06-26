'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, Eye, EyeOff, ArrowRight, BarChart3, Bell, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos. Verifique suas credenciais.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-layout">
      {/* Painel do formulário */}
      <div className="auth-panel">
        <div className="auth-box fade-in">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Package size={22} strokeWidth={2.5} />
            </div>
            <span className="auth-logo-name">StockHome</span>
          </div>

          <h1 className="auth-title">Bem-vindo de volta</h1>
          <p className="auth-subtitle">Entre para gerenciar seu estoque.</p>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="email" className="form-label required">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seunome@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label required">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-ghost btn-icon"
                  style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {loading ? <span className="spinner" /> : <><span>Entrar</span><ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="divider-label" style={{ marginTop: 'var(--space-6)' }}>
            Não tem conta?
          </div>

          <Link href="/cadastro" className="btn btn-secondary btn-lg" style={{ width: '100%', textAlign: 'center' }}>
            Criar conta gratuita
          </Link>

          <p style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-6)' }}>
            Teste gratuito por 14 dias • Sem cartão de crédito
          </p>
        </div>
      </div>

      {/* Painel de branding */}
      <div className="auth-brand-panel">
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07 }}>
          <div style={{ position: 'absolute', top: '10%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'white' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 200, height: 200, borderRadius: '50%', background: 'white' }} />
        </div>
        <div className="auth-brand-content">
          <p className="auth-brand-tagline">
            Saiba o que está acabando, o que está parado e onde você está perdendo produto.
          </p>
          <p className="auth-brand-desc" style={{ marginBottom: 'var(--space-8)' }}>
            Controle de estoque simples e visual para pequenos negócios. Sem planilha complicada, sem ERP caro.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              { icon: <Zap size={18} />, text: 'Registre entrada ou saída em 15 segundos' },
              { icon: <Bell size={18} />, text: 'Alertas automáticos de reposição' },
              { icon: <BarChart3 size={18} />, text: 'Veja o giro de cada produto' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'white', opacity: 0.9 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
