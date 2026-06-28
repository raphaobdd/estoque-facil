'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function EsqueciSenhaPage() {
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [enviado, setEnviado] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
        })

        setLoading(false)

        // Não revelamos se o e-mail existe ou não, por segurança.
        if (error) {
            setError('Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.')
            return
        }

        setEnviado(true)
    }

    return (
        <div className="auth-layout">
            <div className="auth-panel">
                <div className="auth-box fade-in">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <Logo size={24} />
                        </div>
                        <span className="auth-logo-name">StockHome</span>
                    </div>

                    {enviado ? (
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <MailCheck size={48} color="var(--color-success)" strokeWidth={1.5} />
                            </div>
                            <h1 className="auth-title" style={{ marginBottom: 0 }}>Verifique seu e-mail</h1>
                            <p className="auth-subtitle">
                                Se houver uma conta com o e-mail <strong>{email}</strong>, enviamos um link para redefinir sua senha.
                            </p>
                            <Link href="/login" className="btn btn-secondary btn-lg" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                                <ArrowLeft size={16} /> Voltar para o login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="auth-title" style={{ marginBottom: 0 }}>Esqueceu sua senha?</h1>
                            <p className="auth-subtitle" style={{ marginBottom: 'var(--space-2)' }}>
                                Informe seu e-mail e enviaremos um link para você criar uma nova senha.
                            </p>

                            {error && (
                                <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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

                                <button
                                    id="btn-enviar-recuperacao"
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={loading || !email}
                                    style={{ width: '100%', marginTop: 'var(--space-2)' }}
                                >
                                    {loading ? <span className="spinner" /> : <><span>Enviar link de recuperação</span><ArrowRight size={18} /></>}
                                </button>
                            </form>

                            <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)', marginTop: 'var(--space-6)' }}>
                                <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                    <ArrowLeft size={14} /> Voltar para o login
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="auth-brand-panel">
                <div style={{ position: 'absolute', inset: 0, opacity: 0.07 }}>
                    <div style={{ position: 'absolute', top: '10%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'white' }} />
                    <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 200, height: 200, borderRadius: '50%', background: 'white' }} />
                </div>
                <div className="auth-brand-content">
                    <p className="auth-brand-tagline">
                        Saiba o que está acabando, o que está parado e onde você está perdendo produto.
                    </p>
                    <p className="auth-brand-desc">
                        Controle de estoque simples e visual para pequenos negócios. Sem planilha complicada, sem ERP caro.
                    </p>
                </div>
            </div>
        </div>
    )
}