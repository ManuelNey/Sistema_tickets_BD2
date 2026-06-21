import { useEffect, useState } from 'react'
import MatchCard from './MatchCard'
import CompraDetalle from './CompraDetalle'
import ReservaConfirmada from './ReservaConfirmada'
import PagoEntrada from './PagoEntrada'
import CompraExitosa from './CompraExitosa'
import { FilterIcon } from './matchIcons'
import './reserva.css'

function ComprarEntradas({ onIrAMisEntradas }) {
  const [matches, setMatches] = useState([])
  const [allTeams, setAllTeams] = useState([])
  const [estadios, setEstadios] = useState([])
  const [equipoId, setEquipoId] = useState('')
  const [estadioId, setEstadioId] = useState('')
  const [matchesError, setMatchesError] = useState('')
  const [matchesLoading, setMatchesLoading] = useState(false)

  // Maquina de estados: list -> reservar -> confirmada -> pago -> exito
  const [view, setView] = useState('list')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [pedido, setPedido] = useState(null)
  const [resumen, setResumen] = useState(null)

  const fetchMatches = async (eqId, estId) => {
    setMatchesError('')
    setMatchesLoading(true)
    try {
      const token = localStorage.getItem('ticketmatch-token')
      const params = new URLSearchParams()
      if (eqId) params.append('equipoId', eqId)
      if (estId) params.append('estadioId', estId)
      const qs = params.toString()
      const res = await fetch(
        `http://localhost:8080/api/menumatch/matches${qs ? '?' + qs : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error()
      setMatches(await res.json())
    } catch {
      setMatchesError('No se pudieron cargar los partidos')
    } finally {
      setMatchesLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      setMatchesLoading(true)
      setMatchesError('')
      try {
        const token = localStorage.getItem('ticketmatch-token')
        const headers = { Authorization: `Bearer ${token}` }
        const [matchRes, estadiosRes] = await Promise.all([
          fetch('http://localhost:8080/api/menumatch/matches', { headers }),
          fetch('http://localhost:8080/api/estadios', { headers }),
        ])
        if (!matchRes.ok || !estadiosRes.ok) throw new Error()
        const [matchData, estadiosData] = await Promise.all([matchRes.json(), estadiosRes.json()])

        // Extraer equipos únicos para el select
        const teamsMap = new Map()
        matchData.forEach(m => {
          if (!teamsMap.has(m.idEquipoLocal)) teamsMap.set(m.idEquipoLocal, m.equipoLocal)
          if (!teamsMap.has(m.idEquipoVisitante)) teamsMap.set(m.idEquipoVisitante, m.equipoVisitante)
        })
        setAllTeams(
          Array.from(teamsMap, ([id, nombre]) => ({ id, nombre }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
        )
        setEstadios(estadiosData)
        setMatches(matchData)
      } catch {
        setMatchesError('No se pudieron cargar los partidos')
      } finally {
        setMatchesLoading(false)
      }
    }
    init()
  }, [])


  //Funcion para volver a los partidos. Re-fetcha para reflejar disponibilidad actualizada.
  const volverAlMenu = () => {
    setSelectedMatch(null)
    setPedido(null)
    setResumen(null)
    setView('list')
    fetchMatches(equipoId, estadioId)
  }

  if (view === 'reservar' && selectedMatch) {
    return (
      <CompraDetalle
        match={selectedMatch}
        onVolver={volverAlMenu}
        onReservaExitosa={(p) => {
          setPedido(p)
          setView('confirmada')
        }}
      />
    )
  }

  // Si la reserva sale bien, vamos a la parte de confirmacion
  if (view === 'confirmada' && pedido) {
    return (
      <ReservaConfirmada
        pedido={pedido}
        onPagar={() => setView('pago')}
        onPagarMasTarde={volverAlMenu}
      />
    )
  }

  //Si el usuario decide pagar, vamos a la parte de pago, que al finalizar va a mostrar la pantalla de exito.
  if (view === 'pago' && pedido) {
    return (
      <PagoEntrada
        pedido={pedido}
        onVolver={() => setView('confirmada')}
        onPagoExitoso={(r) => {
          setResumen(r)
          setView('exito')
        }}
      />
    )
  }

  //Si sale todo bien, mostramos la pantalla de exito con el resumen de la compra.
  if (view === 'exito' && resumen) {
    return <CompraExitosa resumen={resumen} onIrAMisEntradas={onIrAMisEntradas} onVolver={volverAlMenu} />
  }

  return (
    <div className="buy-view">
      <header className="buy-header">
        <h1 id="dashboard-title">Proximos Partidos</h1>
        <p>Selecciona el partido y reserva tus entradas</p>
      </header>

      <section className="filters-card" aria-label="Filtros">
        <h2>
          <FilterIcon />
          Filtros
        </h2>

        <div className="filters-grid">
          <label>
            <span>Filtrar por equipo</span>
            <select
              value={equipoId}
              onChange={e => {
                setEquipoId(e.target.value)
                fetchMatches(e.target.value, estadioId)
              }}
            >
              <option value="">Todos los equipos</option>
              {allTeams.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Filtrar por estadio</span>
            <select
              value={estadioId}
              onChange={e => {
                setEstadioId(e.target.value)
                fetchMatches(equipoId, e.target.value)
              }}
            >
              <option value="">Todos los estadios</option>
              {estadios.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
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
              <MatchCard
                key={`${match.equipoLocal}-${match.equipoVisitante}-${index}`}
                match={match}
                onComprar={(m) => {
                  setSelectedMatch(m)
                  setView('reservar')
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ComprarEntradas
