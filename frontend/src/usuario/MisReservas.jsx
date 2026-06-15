import { useEffect, useState } from 'react'
import Countdown from './Countdown'
import PagoEntrada from './PagoEntrada'
import CompraExitosa from './CompraExitosa'
import { formatDate, formatPrice, formatTime, getExpiracion } from './format'
import './reserva.css'

// El back no guarda un codigo de reserva; lo derivamos del id de la compra.
function codigoReserva(idCompra) {
  return `RSV-${String(idCompra).padStart(6, '0')}`
}

// Convierte una reserva del backend al "pedido" que espera PagoEntrada.
function reservaToPedido(r) {
  return {
    idCompra: r.idCompra,
    codigoReserva: codigoReserva(r.idCompra),
    equipoLocal: r.equipoLocal,
    equipoVisitante: r.equipoVisitante,
    fecha: r.fechaEncuentro,
    hora: r.horaEncuentro,
    estadio: r.estadio,
    sector: r.sector,
    precioUnitario: r.precioUnitario,
    cantidad: r.cantidad,
    montoTotal: r.montoTotal,
    fechaReserva: r.fechaReserva,
  }
}

function MisReservas() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [view, setView] = useState('list') // list | pago | exito
  const [pedidoSel, setPedidoSel] = useState(null)
  const [resumen, setResumen] = useState(null)

  const cargar = async () => {
    //Al cargar se le hace un fetch al endpoint real de mis-reservas.
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('ticketmatch-token')
      const res = await fetch('http://localhost:8080/api/compra/mis-reservas', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('No se pudieron cargar las reservas')
      setReservas(await res.json())
    } catch {
      setReservas([])
      setError('No se pudieron cargar tus reservas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Diferimos la carga fuera del render sincrono para no disparar
    // setState de forma sincrona dentro del effect (react-hooks/set-state-in-effect).
    Promise.resolve().then(cargar)
  }, [])

  const handlePagar = (reserva) => {
    setPedidoSel(reservaToPedido(reserva))
    setView('pago')
  }

  const handleCancelar = async (reserva) => {
    try {
      //Sirve para si se toca el boton de cancelar.
      const token = localStorage.getItem('ticketmatch-token')
      await fetch(`http://localhost:8080/api/compra/${reserva.idCompra}/cancelar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // cachear error de que no se puede cancelar
    }
    cargar()
  }

  if (view === 'pago' && pedidoSel) {
    return (
      <PagoEntrada
        pedido={pedidoSel}
        onVolver={() => setView('list')}
        onPagoExitoso={(r) => {
          setResumen(r)
          setView('exito')
        }}
      />
    )
  }

  // si paga con exito, muestra el resumen de la compra.
  // Al volver del resumen, recarga las reservas para mostrar el estado actualizado.
  if (view === 'exito' && resumen) {
    return (
      <CompraExitosa
        resumen={resumen}
        onVolver={() => {
          setResumen(null)
          setView('list')
          cargar()
        }}
      />
    )
  }

  // vista principal con el listado de reservas
  return (
    <div className="reservas-view">
      <header className="buy-header">
        <h1 id="dashboard-title">Mis Reservas</h1>
        <p>Historial de reservas y estado de pago</p>
      </header>

      {loading && <p className="matches-status">Cargando reservas...</p>}

      {!loading && error && <p className="matches-status is-error">{error}</p>}

      {!loading && !error && reservas.length === 0 && (
        <p className="matches-status">Todavia no tenes reservas.</p>
      )}

      <div className="reservas-list">
        {reservas.map((r) => (
          <ReservaCard
            key={r.idCompra}
            reserva={r}
            onPagar={() => handlePagar(r)}
            onCancelar={() => handleCancelar(r)}
          />
        ))}
      </div>
    </div>
  )
}

// Card de cada reserva en el listado. 
function ReservaCard({ reserva, onPagar, onCancelar }) {
  const [expirada, setExpirada] = useState(false)
  const esPendiente = reserva.estado === 'pendiente'
  const expiraMs = getExpiracion(reserva.fechaReserva)

  return (
    <article className="reserva-card">
      <div className="reserva-card-head">
        <div>
          <p className="comp">Copa Mundial FIFA 2026</p>
          <h3>
            {reserva.equipoLocal} vs {reserva.equipoVisitante}
          </h3>
        </div>
        <span className="reserva-card-code">{codigoReserva(reserva.idCompra)}</span>
      </div>

      <div className="reserva-card-body">
        <div className="reserva-card-info">
          <span>📅 {formatDate(reserva.fechaEncuentro)} · 🕒 {formatTime(reserva.horaEncuentro)}</span>
          <span>📍 {reserva.estadio}</span>
          <span>{reserva.sector} · {reserva.cantidad} {reserva.cantidad === 1 ? 'entrada' : 'entradas'}</span>
          <span className="reserva-card-precio">{formatPrice(reserva.montoTotal)}</span>
        </div>

        <div className="reserva-card-side">
          <EstadoBadge estado={reserva.estado} />

          {esPendiente && !expirada && (
            <>
              <Countdown expiraMs={expiraMs} onExpire={() => setExpirada(true)} />
              <button className="btn-primary" type="button" onClick={onPagar} style={{ padding: '0.5rem 1rem' }}>
                Pagar ahora
              </button>
              <button className="btn-secondary" type="button" onClick={onCancelar} style={{ padding: '0.5rem 1rem' }}>
                Cancelar
              </button>
            </>
          )}

          {esPendiente && expirada && (
            <span className="countdown-pill is-expired">Reserva expirada</span>
          )}
        </div>
      </div>
    </article>
  )
}

// Muestra el estado de la reserva con un chapita de color.
function EstadoBadge({ estado }) {
  const map = {
    pendiente: { cls: 'is-pendiente', label: 'Pendiente de pago' },
    pagada: { cls: 'is-pagada', label: 'Pagada' },
    cancelada: { cls: 'is-cancelada', label: 'Cancelada' },
  }
  const { cls, label } = map[estado] ?? { cls: '', label: estado }
  return <span className={`estado-badge ${cls}`}>{label}</span>
}

export default MisReservas
