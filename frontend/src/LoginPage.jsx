import { API_URL } from './config.js'
import { useState } from 'react'
import { useAuth } from './context/useAuth'
import soccerBall from './assets/ticket.png'

function LoginPage({ onRegister }) {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailFocus, setEmailFocus] = useState(false)
  const [passFocus,  setPassFocus]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/usuario/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail: email, contrasena: password }),
      })
      let data = null
      try { data = await res.json() } catch { data = null }
      if (!res.ok) throw new Error(data?.message || 'Login failed')
      const usuario = data?.usuario || data?.Usuario || data
      if (usuario?.rol === 'funcionario') {
        setError('Los funcionarios deben iniciar sesión desde la app móvil.')
        return
      }
      login(data)
    } catch {
      setError('No se pudo iniciar sesión. Verificá tus credenciales.')
    } finally {
      setIsLoading(false)
    }
  }

  const hasError = !!error
  const emailBorder = emailFocus ? '#7C3AED' : hasError ? 'rgba(239,68,68,0.5)' : '#E2E0E8'
  const passBorder  = passFocus  ? '#7C3AED' : hasError ? 'rgba(239,68,68,0.5)' : '#E2E0E8'
  const focusShadow = '0 0 0 3px rgba(124,58,237,0.1)'

  return (
    <div className="auth-shell">

      {/* ── Panel de marca ── */}
      <div className="auth-brand">
        <div className="auth-blob auth-blob--1" />
        <div className="auth-blob auth-blob--2" />
        <div className="auth-grid-bg" />
        <div className="auth-brand-content">
          <div className="auth-logo-box">
            <img src={soccerBall} alt="TicketMatch" className="auth-logo-img" />
          </div>
          <div className="auth-brand-title">TicketMatch</div>
          <div className="auth-brand-sub">
            La mejor plataforma para comprar entradas para el Mundial FIFA 2026.
          </div>
          <div className="auth-fifa-badge">
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" /><path d="M7 3.5v3l2 2" />
            </svg>
            Copa Mundial FIFA 2026
          </div>
        </div>
      </div>

      {/* ── Panel de formulario ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">

          <div className="auth-form-header">
            <div className="auth-form-title">Bienvenido de nuevo</div>
            <div className="auth-form-sub">Ingresá tus credenciales para continuar</div>
          </div>

          <form onSubmit={handleSubmit} className="auth-fields">

            {/* Email */}
            <div>
              <label className="auth-label">Correo electrónico</label>
              <div className="auth-input-wrap" style={{ borderColor: emailBorder, boxShadow: emailFocus ? focusShadow : 'none' }}>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#B0ACBA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                  <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" /><path d="M1.5 5.5l6.5 4 6.5-4" />
                </svg>
                <input
                  type="email"
                  placeholder="usuario@mail.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  className="auth-input"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="auth-label">Contraseña</label>
              <div className="auth-input-wrap" style={{ borderColor: passBorder, boxShadow: passFocus ? focusShadow : 'none' }}>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#B0ACBA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                  <rect x="3.5" y="7" width="9" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                </svg>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  className="auth-input"
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Ocultar' : 'Mostrar'}>
                  {showPass
                    ? <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M1 8s2.5-5.5 7-5.5S15 8 15 8s-2.5 5.5-7 5.5S1 8 1 8z" /><circle cx="8" cy="8" r="2" /><line x1="1" y1="1" x2="15" y2="15" /></svg>
                    : <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M1 8s2.5-5.5 7-5.5S15 8 15 8s-2.5 5.5-7 5.5S1 8 1 8z" /><circle cx="8" cy="8" r="2" /></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {hasError && (
              <div className="auth-error">
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
                  <circle cx="7" cy="7" r="5.5" /><line x1="7" y1="4.5" x2="7" y2="7.5" /><circle cx="7" cy="9.5" r="0.6" fill="#EF4444" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="auth-switch">
            ¿No tenés cuenta?{' '}
            <button type="button" className="auth-switch-link" onClick={onRegister}>Registrate</button>
          </div>

        </div>
      </div>

    </div>
  )
}

export default LoginPage
