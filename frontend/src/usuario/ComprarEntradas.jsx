import { useEffect, useState } from 'react'
import MatchCard from './MatchCard'
import CompraDetalle from './CompraDetalle'
import ReservaConfirmada from './ReservaConfirmada'
import PagoEntrada from './PagoEntrada'
import CompraExitosa from './CompraExitosa'
import { FilterIcon } from './matchIcons'
import './reserva.css'

function ComprarEntradas() {
  const [matches, setMatches] = useState([])
  const [matchesError, setMatchesError] = useState('')
  const [matchesLoading, setMatchesLoading] = useState(false)

  // Maquina de estados: list -> reservar -> confirmada -> pago -> exito
  const [view, setView] = useState('list')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [pedido, setPedido] = useState(null)
  const [resumen, setResumen] = useState(null)

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


  //Funcion para volver a los partidos.
  const volverAlMenu = () => {
    setSelectedMatch(null)
    setPedido(null)
    setResumen(null)
    setView('list')
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
    return <CompraExitosa resumen={resumen} onVolver={volverAlMenu} />
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
              <MatchCard
                key={`${match.localTeam}-${match.visitorTeam}-${index}`}
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
