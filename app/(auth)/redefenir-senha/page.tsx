'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function RedefinirSenhaPage() {
    const router = useRouter()
    const supabase = createClient()

    const [checandoSessao, setChecandoSessao] = useState(true)
    const [sessaoValida, setSessaoValida] = useState(false)

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [sucesso, setSucesso] = useState(false)

    useEffect(() => {
        // O link do e-mail (via /auth/callback) já troca o código por uma sessão
        // de recuperação antes de chegar aqui. Só confirmamos que existe sessão.
        supabase.auth.getUser().then(({ data: { user } }) => {
            setSessaoValida(!!user)
            setChecandoSessao(false)
        })
    }, [supabase])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            return
        }
        if (password !== confirmPassword) {
            setError('As senhas não conferem.')
            return
        }

        setLoading(true)
        const { error: updateError } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (updateError) {
            setError('Não foi possível redefinir sua senha. O link pode ter expirado, solicite um novo.')
            return
        }

        setSucesso(true)
        setTimeout(() => router.push('/dashboard'), 2000)
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

                    {checandoSessao ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8) 0' }}>
                            <span className="spinner" />
                        </div>
                    ) : sucesso ? (
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <CheckCircle size={48} color="var(--color-success)" strokeWidth={1.5} />
                            </div>
                            <h1 className="auth-title" style={{ marginBottom: 0 }}>Senha redefinida!</h1>
                            <p className="auth-subtitle">Levando você para o dashboard...</p>
                        </div>
                    ) : !sessaoValida ? (
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <h1 className="auth-title" style={{ marginBottom: 0 }}>Link inválido ou expirado</h1>
                            <p className="auth-subtitle">
                                Solicite um novo link de redefinição de senha.
                            </p>
                            <Link href="/esqueci-senha" className="btn btn-primary btn-lg" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                                Solicitar novo link
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="auth-title" style={{ marginBottom: 0 }}>Criar nova senha</h1>
                            <p className="auth-subtitle" style={{ marginBottom: 'var(--space-2)' }}>
                                Escolha uma nova senha para sua conta.
                            </p>

                            {error && (
                                <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label htmlFor="password" className="form-label required">Nova senha</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-input"
                                            placeholder="Mínimo 6 caracteres"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            autoComplete="new-password"
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

                                <div className="form-group">
                                    <label htmlFor="confirmPassword" className="form-label required">Confirmar nova senha</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        className="form-input"
                                        placeholder="Repita a senha"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>

                                <button
                                    id="btn-redefinir-senha"
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={loading || !password || !confirmPassword}
                                    style={{ width: '100%', marginTop: 'var(--space-2)' }}
                                >
                                    {loading ? <span className="spinner" /> : <><span>Redefinir senha</span><ArrowRight size={18} /></>}
                                </button>
                            </form>
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