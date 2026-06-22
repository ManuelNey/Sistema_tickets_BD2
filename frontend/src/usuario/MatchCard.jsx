import { flagUrl } from './teamFlags'
import { formatDate, formatPrice, formatTime } from './format'

function MatchCard({ match, onComprar }) {
  const url1 = flagUrl(match.equipoLocal)
  const url2 = flagUrl(match.equipoVisitante)

  return (
    <article className="match-card">
      {/* Cabecera oscura con banderas */}
      <div className="match-hero">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -10%, rgba(124,58,237,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div className="match-competition">
          <span className="match-competition-dot" />
          Copa Mundial FIFA 2026
        </div>
        <div className="match-teams">
          <div className="match-team">
            <FlagOrInitials url={url1} name={match.equipoLocal} />
            <span className="match-team-name">{match.equipoLocal}</span>
          </div>
          <div className="match-vs-circle">
            <span>VS</span>
          </div>
          <div className="match-team">
            <FlagOrInitials url={url2} name={match.equipoVisitante} />
            <span className="match-team-name">{match.equipoVisitante}</span>
          </div>
        </div>
      </div>

      {/* Cuerpo blanco */}
      <div className="match-body">
        <div className="match-info-rows">
          <div className="match-info-row">
            <CalendarMiniIcon />
            <span>{formatDate(match.fecha)} · {formatTime(match.hora)}</span>
          </div>
          <div className="match-info-row">
            <PinMiniIcon />
            <span>{match.estadio}</span>
          </div>
          <div className="match-info-row is-highlight">
            <UsersMiniIcon />
            <span>{match.entradasDisponibles} disponibles</span>
          </div>
        </div>

        <div className="match-divider" />

        <div className="match-prices">
          <div>
            <span className="match-price-label">Desde</span>
            <strong className="match-price-from">{formatPrice(match.precioMinimo)}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="match-price-label">Hasta</span>
            <strong className="match-price-to">{formatPrice(match.precioMaximo)}</strong>
          </div>
        </div>

        <button className="match-cta" type="button" onClick={() => onComprar(match)}>
          Ver entradas
        </button>
      </div>
    </article>
  )
}

function FlagOrInitials({ url, name }) {
  if (url) {
    return <img className="match-flag-img" src={url} alt={name} />
  }
  return (
    <span className="match-flag-fallback">
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}

function CalendarMiniIcon() {
  return (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
      <rect x="1.5" y="2" width="11" height="10" rx="1.5" />
      <line x1="1.5" y1="5.5" x2="12.5" y2="5.5" />
      <line x1="4.5" y1="1" x2="4.5" y2="3.5" />
      <line x1="9.5" y1="1" x2="9.5" y2="3.5" />
    </svg>
  )
}

function PinMiniIcon() {
  return (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
      <path d="M7 13S2 8.5 2 5.5a5 5 0 0 1 10 0C12 8.5 7 13 7 13z" />
      <circle cx="7" cy="5.5" r="1.5" />
    </svg>
  )
}

function UsersMiniIcon() {
  return (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
      <circle cx="4.5" cy="4" r="1.8" />
      <path d="M1 10.5c0-1.9 1.6-3.2 3.5-3.2s3.5 1.3 3.5 3.2" />
      <path d="M8.5 3a2 2 0 0 1 0 2M10.5 7c.9.5 1.5 1.4 1.5 2.5" />
    </svg>
  )
}

export default MatchCard
