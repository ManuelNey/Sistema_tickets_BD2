import { useEffect, useMemo, useState } from 'react'
import SidebarIcon from '../shared/SidebarIcon'

function DashboardAdmin() {
  const [topEncuentros, setTopEncuentros] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hoveredId, setHoveredId] = useState(null)

  const loadTopEncuentros = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('ticketmatch-token')
      const response = await fetch('http://localhost:8080/api/Estadisticas/TopEncuentros', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Top encounters request failed')
      }

      setTopEncuentros(await response.json())
    } catch {
      setTopEncuentros([])
      setError('No se pudieron cargar las estadisticas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(loadTopEncuentros)
  }, [])

  const maxEntradas = useMemo(
    () => Math.max(...topEncuentros.map((encuentro) => getEntradasVendidas(encuentro)), 1),
    [topEncuentros]
  )

  const axisMax = useMemo(() => getAxisMax(maxEntradas), [maxEntradas])
  const ticks = useMemo(() => buildTicks(axisMax), [axisMax])

  return (
    <div className="admin-view stats-view">
      <header className="admin-header">
        <div>
          <h1 id="dashboard-title">Estadisticas</h1>
          <p>Encuentros con mayor cantidad de entradas vendidas</p>
        </div>
      </header>

      {loading && <p className="matches-status">Cargando estadisticas...</p>}
      {!loading && error && <p className="matches-status is-error">{error}</p>}

      {!loading && !error && topEncuentros.length === 0 && (
        <p className="matches-status">Todavia no hay ventas para mostrar.</p>
      )}

      {!loading && !error && topEncuentros.length > 0 && (
        <section className="stats-card" aria-label="Top encuentros mas vendidos">
          <div className="stats-card-header">
            <div>
              <h2>Top encuentros vendidos</h2>
              <p>Ranking por entradas activas, utilizadas o transferidas</p>
            </div>
            <span className="stats-pill">
              <SidebarIcon name="chart" />
              Top {topEncuentros.length}
            </span>
          </div>

          <div className="stats-chart">
            <div className="stats-axis" aria-hidden="true">
              {ticks.map((tick) => (
                <span key={tick}>{formatNumber(tick)}</span>
              ))}
            </div>

            <div className="stats-plot">
              <div className="stats-grid-lines" aria-hidden="true">
                {ticks.map((tick) => (
                  <span key={tick} />
                ))}
              </div>

              <div className="stats-bars">
                {topEncuentros.map((encuentro) => {
                  const entradasVendidas = getEntradasVendidas(encuentro)
                  const height = Math.max((entradasVendidas / axisMax) * 100, 4)
                  const isHovered = hoveredId === encuentro.id

                  return (
                    <div className="stats-bar-slot" key={encuentro.id}>
                      <button
                        aria-label={`${getMatchLabel(encuentro)}: ${entradasVendidas} entradas vendidas`}
                        className="stats-bar-button"
                        onBlur={() => setHoveredId(null)}
                        onFocus={() => setHoveredId(encuentro.id)}
                        onMouseEnter={() => setHoveredId(encuentro.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{ '--bar-height': `${height}%` }}
                        type="button"
                      >
                        <span className="stats-bar" />
                        {isHovered && <StatsTooltip encuentro={encuentro} />}
                      </button>
                      <span className="stats-bar-label">{getShortMatchLabel(encuentro)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function StatsTooltip({ encuentro }) {
  return (
    <span className="stats-tooltip">
      <strong>{getMatchLabel(encuentro)}</strong>
      <span>
        Entradas vendidas: <b>{formatNumber(getEntradasVendidas(encuentro))}</b>
      </span>
      <span>Estadio: {encuentro.nombreEstadio}</span>
      <span>Fecha: {formatDate(encuentro.fecha)}</span>
    </span>
  )
}

function getEntradasVendidas(encuentro) {
  return encuentro.entradasVendidas ?? encuentro.cantidadEntradasVendidas ?? 0
}

function getMatchLabel(encuentro) {
  return `${encuentro.equipoLocal} vs ${encuentro.equipoVisitante}`
}

function getShortMatchLabel(encuentro) {
  const local = shortenTeam(encuentro.equipoLocal)
  const visitante = shortenTeam(encuentro.equipoVisitante)

  return `${local} vs ${visitante}`
}

function shortenTeam(team) {
  if (!team) {
    return '-'
  }

  return team.length > 10 ? `${team.slice(0, 9)}.` : team
}

function getAxisMax(maxValue) {
  return Math.max(Math.ceil(maxValue / 5) * 5, 5)
}

function buildTicks(axisMax) {
  const step = axisMax / 4

  return [axisMax, axisMax - step, axisMax - step * 2, axisMax - step * 3, 0]
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-UY').format(Math.round(value))
}

function formatDate(date) {
  if (!date) {
    return 'Fecha a confirmar'
  }

  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export default DashboardAdmin
