import { useEffect, useState } from 'react'
import { InfoLine, TrophyIcon, SendIcon } from './matchIcons'
import { formatDate, formatTime } from './format'
import TeamBadge from './TeamBadge'
import './reserva.css'

function MisEntradas() {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('ticketmatch-token')
      const res = await fetch('http://localhost:8080/api/entradas/mis-entradas', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('No se pudieron cargar las entradas')
      setGrupos(await res.json())
    } catch {
      setGrupos([])
      setError('No se pudieron cargar tus entradas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Diferimos la carga fuera del render sincrono (mismo criterio que Mis Reservas).
    Promise.resolve().then(cargar)
  }, [])

  // El flujo de envío/transferencia se implementa en una etapa posterior.
  const handleEnviar = () => {
    // TODO: abrir el flujo de envío de entrada (transferencias).
  }

  return (
    <div className="entradas-view">
      <header className="buy-header">
        <h1 id="dashboard-title">Mis Entradas</h1>
        <p>Entradas que has comprado</p>
      </header>

      {loading && <p className="matches-status">Cargando entradas...</p>}

      {!loading && error && <p className="matches-status is-error">{error}</p>}

      {!loading && !error && grupos.length === 0 && (
        <p className="matches-status">Todavia no tenes entradas.</p>
      )}

      <div className="entradas-grid">
        {grupos.map((g) => (
          <EntradaCard key={g.idHabilita} grupo={g} onEnviar={() => handleEnviar(g)} />
        ))}
      </div>
    </div>
  )
}

// Card de un partido+sector con el detalle y los contadores de entradas.
function EntradaCard({ grupo, onEnviar }) {
  const sinDisponibles = grupo.disponibles === 0

  return (
    <article className="entrada-card">
      <div className="entrada-card-head">
        <div className="entrada-card-top">
          <p className="comp">
            <TrophyIcon />
            Copa Mundial FIFA 2026
          </p>
        </div>

        <div className="teams-row">
          <TeamBadge name={grupo.equipoLocal} />
          <span className="versus">VS</span>
          <TeamBadge name={grupo.equipoVisitante} />
        </div>
      </div>

      <div className="entrada-card-body">
        <InfoLine icon="calendarLine" text={formatDate(grupo.fechaEncuentro)} />
        <InfoLine icon="clock" text={formatTime(grupo.horaEncuentro)} />
        <InfoLine icon="pin" text={`${grupo.estadio}, ${grupo.ciudad}`} />

        <div className="entrada-seccion">
          <span>Sección:</span>
          <strong>{grupo.sector}</strong>
        </div>

        <div className="entrada-stock">
          {grupo.transferidas > 0 && (
            <span className="stock-badge is-transferida">{grupo.transferidas} transferida{grupo.transferidas === 1 ? '' : 's'}</span>
          )}
          <span className="stock-badge is-disponible">{grupo.disponibles} disponible{grupo.disponibles === 1 ? '' : 's'}</span>
        </div>

        <button
          className="btn-primary"
          type="button"
          onClick={onEnviar}
          disabled={sinDisponibles}
          title={sinDisponibles ? 'No tenes entradas disponibles para enviar' : undefined}
        >
          <SendIcon />
          Enviar Entrada
        </button>
      </div>
    </article>
  )
}

export default MisEntradas
