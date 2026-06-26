import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { flagUrl } from './teamFlags'
import { formatDate, formatTime } from './format'
import EnviarEntrada from './EnviarEntrada'
import './reserva.css'

function MisEntradas({ onIrAEnviadas }) {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Maquina de estados simple: list -> enviar.
  const [view, setView] = useState('list')
  const [grupoSel, setGrupoSel] = useState(null)

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('ticketmatch-token')
      const res = await fetch(`${API_URL}/api/entradas/mis-entradas`, {
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
    // Diferimos la carga fuera del render sincrono igual que con misReservas.jsx 
    Promise.resolve().then(cargar)
  }, [])

  // Abre la pantalla de envío con el grupo elegido.
  const handleEnviar = (grupo) => {
    setGrupoSel(grupo)
    setView('enviar')
  }

  // Tras enviar con éxito: limpia estado y navega a Transferencias Enviadas para que el
  // usuario vea el estado de la transferencia recién creada.
  const handleEnviado = () => {
    setView('list')
    setGrupoSel(null)
    onIrAEnviadas?.()
  }

  if (view === 'enviar' && grupoSel) {
    return (
      <EnviarEntrada
        grupo={grupoSel}
        onVolver={() => { setView('list'); setGrupoSel(null) }}
        onEnviado={handleEnviado}
      />
    )
  }

  return (
    <div className="buy-view">
      <header className="buy-header">
        <div>
          <h1 id="dashboard-title">Mis Entradas</h1>
          <p>Entradas actualmente en tu posesión, agrupadas por encuentro y sector· {grupos.length > 0 ? `${grupos.length} en total` : ''}</p>
        </div>
      </header>
      <div className="filters-divider" />

      {loading && <p className="matches-status">Cargando entradas...</p>}
      {!loading && error && <p className="matches-status is-error">{error}</p>}
      {!loading && !error && grupos.length === 0 && (
        <p className="matches-status">Todavia no tenes entradas.</p>
      )}

      <div className="matches-grid" style={{ marginTop: 16 }}>
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
  const url1 = flagUrl(grupo.equipoLocal)
  const url2 = flagUrl(grupo.equipoVisitante)

  return (
    <article className="match-card">
      {/* Cabecera oscura con banderas */}
      <div className="match-hero">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -10%, rgba(124,58,237,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div className="match-competition" style={{ marginBottom: 10 }}>
          <span className="match-competition-dot" />
          Copa Mundial FIFA 2026
          <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9.5, fontWeight: 700, padding: '2px 9px', borderRadius: 100, letterSpacing: 0.2 }}>
            {grupo.sector}
          </span>
        </div>
        <div className="match-teams">
          <div className="match-team">
            {url1
              ? <img className="match-flag-img" src={url1} alt={grupo.equipoLocal} />
              : <span className="match-flag-fallback">{grupo.equipoLocal.slice(0, 2).toUpperCase()}</span>
            }
            <span className="match-team-name">{grupo.equipoLocal}</span>
          </div>
          <div className="match-vs-circle"><span>VS</span></div>
          <div className="match-team">
            {url2
              ? <img className="match-flag-img" src={url2} alt={grupo.equipoVisitante} />
              : <span className="match-flag-fallback">{grupo.equipoVisitante.slice(0, 2).toUpperCase()}</span>
            }
            <span className="match-team-name">{grupo.equipoVisitante}</span>
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="match-body">
        <div className="match-info-rows" style={{ marginBottom: 10 }}>
          <div className="match-info-row">
            <CalMiniSvg />
            <span>{formatDate(grupo.fechaEncuentro)} · {formatTime(grupo.horaEncuentro)}</span>
          </div>
          <div className="match-info-row">
            <PinMiniSvg />
            <span>{grupo.estadio}, {grupo.ciudad}</span>
          </div>
        </div>

        <div className="match-divider" />

        {/* Badges de transferencias y disponibles */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 11 }}>
          {grupo.transferidas > 0 && (
            <span className="entrada-badge-transferred">
              <SendSmSvg />
              {grupo.transferidas} transf.
            </span>
          )}
          <span className={`entrada-badge-avail ${sinDisponibles ? 'is-zero' : ''}`}>
            {grupo.disponibles} disponible{grupo.disponibles !== 1 ? 's' : ''}
          </span>
        </div>

        <button
          className={sinDisponibles ? 'entrada-btn-disabled' : 'match-cta'}
          type="button"
          onClick={onEnviar}
          disabled={sinDisponibles}
          title={sinDisponibles ? 'No tenes entradas disponibles para enviar' : undefined}
          style={{ marginTop: 'auto' }}
        >
          <SendSmSvg />
          {sinDisponibles ? 'Sin entradas disponibles' : 'Enviar Entrada'}
        </button>
      </div>
    </article>
  )
}

function CalMiniSvg() {
  return (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
      <rect x="1.5" y="2" width="11" height="10" rx="1.5" /><line x1="1.5" y1="5.5" x2="12.5" y2="5.5" /><line x1="4.5" y1="1" x2="4.5" y2="3.5" /><line x1="9.5" y1="1" x2="9.5" y2="3.5" />
    </svg>
  )
}
function PinMiniSvg() {
  return (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
      <path d="M7 13S2 8.5 2 5.5a5 5 0 0 1 10 0C12 8.5 7 13 7 13z" /><circle cx="7" cy="5.5" r="1.5" />
    </svg>
  )
}
function SendSmSvg() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
      <path d="M13 1 1 13M13 1H7M13 1v6" />
    </svg>
  )
}

export default MisEntradas
