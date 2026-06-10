import { useState } from 'react'
import BallLogo from './shared/BallLogo'
import { useAuth } from './context/useAuth'

function LoginPage() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/usuario/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mail: email,
          contrasena: password,
        }),
      })

      let data = null

      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Login failed')
      }

      login(data)
    } catch {
      setError('No se pudo iniciar sesion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">
          <BallLogo />
        </div>

        <header className="login-header">
          <h1 id="login-title">TicketMatch</h1>
          <p>Ingresa a tu cuenta</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <span className="input-shell">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 6.5h16v11H4z" />
                <path d="m4.5 7 7.5 6 7.5-6" />
              </svg>
              <input
                type="email"
                name="email"
                placeholder="tu@email.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </span>
          </label>

          <label className="field">
            <span>Contrasena</span>
            <span className="input-shell">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M6.5 10.5h11v9h-11z" />
                <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
              </svg>
              <input
                type="password"
                name="password"
                placeholder="********"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </span>
          </label>

          {error && <p className="login-error">{error}</p>}

          <button className="login-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Iniciar Sesion'}
          </button>
        </form>
      </section>

      <p className="register-link">
        No tienes cuenta? <a href="#registro">Registrate</a>
      </p>
    </main>
  )
}

export default LoginPage