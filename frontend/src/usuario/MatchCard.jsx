import { InfoLine, TrophyIcon } from './matchIcons'

function MatchCard({ match }) {
  const dateText = formatDate(match.date)
  const timeText = formatTime(match.time)
  const price = formatPrice(match.minPrice)

  return (
    <article className="match-card">
      <div className="match-hero">
        <p className="competition">
          <TrophyIcon />
          Copa Mundial FIFA 2026
        </p>

        <div className="teams-row">
          <TeamBadge name={match.localTeam} />
          <span className="versus">VS</span>
          <TeamBadge name={match.visitorTeam} />
        </div>
      </div>

      <div className="match-body">
        <InfoLine icon="calendarLine" text={dateText} />
        <InfoLine icon="clock" text={timeText} />
        <InfoLine icon="pin" text={match.stadiumName} />
        <InfoLine icon="users" text={`${match.availableTickets} disponibles`} highlight />

        <div className="price-block">
          <span>Desde</span>
          <strong>{price}</strong>
        </div>

        <button className="buy-button" type="button">
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

function formatDate(date) {
  if (!date) {
    return 'Fecha a confirmar'
  }

  return new Intl.DateTimeFormat('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function formatTime(time) {
  if (!time) {
    return 'Hora a confirmar'
  }

  return time.slice(0, 5)
}

function formatPrice(price) {
  if (price === undefined || price === null) {
    return '$0'
  }

  return `$${Math.round(price)}`
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
