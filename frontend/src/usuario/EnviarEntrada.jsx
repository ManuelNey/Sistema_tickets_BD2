import { useState } from 'react'
import { SendIcon } from './matchIcons'
import { formatDate, formatTime } from './format'
import './reserva.css'

// Pantalla para enviar/transferir entradas de un grupo (card de Mis Entradas) a otro usuario.
// El usuario solo elige email del receptor y cantidad; el back decide qué entradas usar.
function EnviarEntrada({ grupo, onVolver, onEnviado }) {
  const [email, setEmail] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  // Resultado del envío exitoso, para mostrar el modal de confirmación.
  const [resultado, setResultado] = useState(null)

  // Opciones de cantidad: 1..disponibles.
  const opciones = Array.from({ length: grupo.disponibles }, (_, i) => i + 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Ingresá el email del destinatario.')
      return
    }

    setEnviando(true)
    try {
      const token = localStorage.getItem('ticketmatch-token')
      const res = await fetch('http://localhost:8080/api/entradas/transferir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          idHabilita: grupo.idHabilita,
          cantidad,
          receptorMail: email.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'No se pudo enviar la entrada')
      setResultado({ enviadas: data.enviadas ?? cantidad, email: email.trim() })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pago-view">
      <div className="pago-topbar">
        <button className="btn-secondary" type="button" onClick={onVolver}>← Volver</button>
      </div>

      <header className="buy-header">
        <h1 id="dashboard-title">Enviar Entrada</h1>
        <p>Transfiere tu entrada a otra persona</p>
      </header>

      <div className="pago-layout">
        <section className="pago-card">
          <h3>Entrada Seleccionada</h3>

          <div className="enviar-detalle">
            <div className="enviar-row"><span>Partido</span><strong>{grupo.equipoLocal} vs {grupo.equipoVisitante}</strong></div>
            <div className="enviar-row"><span>Fecha</span><strong>{formatDate(grupo.fechaEncuentro)}</strong></div>
            <div className="enviar-row"><span>Hora</span><strong>{formatTime(grupo.horaEncuentro)}</strong></div>
            <div className="enviar-row"><span>Estadio</span><strong>{grupo.estadio}, {grupo.ciudad}</strong></div>
          </div>

          <div className="enviar-resumen">
            <div><span>Sección</span><strong>{grupo.sector}</strong></div>
            <div><span>Entradas disponibles</span><strong>{grupo.disponibles}</strong></div>
          </div>
        </section>

        <form className="pago-card" onSubmit={handleSubmit}>
          <h3>Datos del Destinatario</h3>

          <div className="pago-field">
            <label htmlFor="dest-email">Email del destinatario</label>
            <input
              id="dest-email"
              type="email"
              placeholder="destinatario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="pago-field">
            <label htmlFor="dest-cantidad">Cantidad de entradas a enviar</label>
            <select
              id="dest-cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
            >
              {opciones.map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'entrada' : 'entradas'}</option>
              ))}
            </select>
          </div>

          <p className="enviar-nota">
            <strong>Nota:</strong> una vez enviada, el destinatario recibirá la transferencia y podrá aceptar la entrada.
          </p>

          {error && <p className="matches-status is-error">{error}</p>}

          <button className="btn-primary" type="submit" disabled={enviando} style={{ width: '100%' }}>
            <SendIcon />
            {enviando ? 'Enviando...' : 'Enviar Entrada'}
          </button>
        </form>
      </div>

      {resultado && (
        <div className="modal-backdrop" onClick={() => onEnviado(resultado.enviadas)}>
          <div className="stadium-modal enviar-exito" onClick={(e) => e.stopPropagation()}>
            <div className="enviar-exito-check">✓</div>
            <h2>¡Entrada enviada!</h2>
            <p>
              Enviaste <strong>{resultado.enviadas}</strong> {resultado.enviadas === 1 ? 'entrada' : 'entradas'} a{' '}
              <strong>{resultado.email}</strong>. Quedan en estado <strong>transferida</strong> hasta que el destinatario las acepte.
            </p>
            <button className="btn-primary" type="button" onClick={() => onEnviado(resultado.enviadas)} style={{ width: '100%' }}>
              Volver a Mis Entradas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnviarEntrada
