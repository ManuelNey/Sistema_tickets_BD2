import { InfoLine, TrophyIcon } from './matchIcons'
import { formatDate, formatPrice, formatTime } from './format'

function MatchCard({ match, onComprar }) {
  const dateText = formatDate(match.fecha)
  const timeText = formatTime(match.hora)
  const minPrice = formatPrice(match.precioMinimo)
  const maxPrice = formatPrice(match.precioMaximo)

  return (
    <article className="match-card">
      <div className="match-hero">
        <p className="competition">
          <TrophyIcon />
          Copa Mundial FIFA 2026
        </p>

        <div className="teams-row">
          <TeamBadge name={match.equipoLocal} />
          <span className="versus">VS</span>
          <TeamBadge name={match.equipoVisitante} />
        </div>
      </div>

      <div className="match-body">
        <InfoLine icon="calendarLine" text={dateText} />
        <InfoLine icon="clock" text={timeText} />
        <InfoLine icon="pin" text={match.estadio} />
        <InfoLine icon="users" text={`${match.entradasDisponibles} disponibles`} highlight />

        <div className="price-block">
          <div>
            <span>Desde</span>
            <strong>{minPrice}</strong>
          </div>
          <div>
            <span>Hasta</span>
            <strong>{maxPrice}</strong>
          </div>
        </div>

        <button className="buy-button" type="button" onClick={() => onComprar(match)}>
          Comprar Entradas
        </button>
      </div>
    </article>
  )
}

function TeamBadge({ name }) {
  return (
    <div className="team">
      <div className="team-avatar">{getInitials(name)}</div>
      <span>{name}</span>
    </div>
  )
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default MatchCard
