import { useEffect, useState } from 'react'
import MatchCard from './MatchCard'
import { FilterIcon } from './matchIcons'

function ComprarEntradas() {
  const [matches, setMatches] = useState([])
  const [matchesError, setMatchesError] = useState('')
  const [matchesLoading, setMatchesLoading] = useState(false)

  useEffect(() => {
    const loadMatches = async () => {
      setMatchesError('')
      setMatchesLoading(true)

      try {
        const token = localStorage.getItem('ticketmatch-token')
        const response = await fetch('http://localhost:8080/api/menumatch/matches', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Matches request failed')
        }

        const data = await response.json()
        setMatches(data)
      } catch {
        setMatchesError('No se pudieron cargar los partidos')
      } finally {
        setMatchesLoading(false)
      }
    }

    loadMatches()
  }, [])

  return (
    <div className="buy-view">
      <header className="buy-header">
        <h1 id="dashboard-title">Proximos Partidos</h1>
        <p>Selecciona el partido y compra tus entradas</p>
      </header>

      <section className="filters-card" aria-label="Filtros">
        <h2>
          <FilterIcon />
          Filtros
        </h2>

        <div className="filters-grid">
          <label>
            <span>Filtrar por equipo</span>
            <select defaultValue="todos">
              <option value="todos">Todos los equipos</option>
              <option value="local">Equipo local</option>
              <option value="visitante">Equipo visitante</option>
            </select>
          </label>

          <label>
            <span>Filtrar por estadio</span>
            <select defaultValue="todos">
              <option value="todos">Todos los estadios</option>
              <option value="montevideo">Montevideo</option>
              <option value="otros">Otros estadios</option>
            </select>
          </label>
        </div>
      </section>

      {matchesLoading && <p className="matches-status">Cargando partidos...</p>}
      {matchesError && <p className="matches-status is-error">{matchesError}</p>}

      {!matchesLoading && !matchesError && (
        <div className="matches-grid">
          {matches.length === 0 ? (
            <p className="matches-status">No hay partidos disponibles.</p>
          ) : (
            matches.map((match, index) => (
              <MatchCard key={`${match.localTeam}-${match.visitorTeam}-${index}`} match={match} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ComprarEntradas
