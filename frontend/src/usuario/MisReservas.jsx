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

function MisReservas({ onIrAMisEntradas }) {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Solapa activa: 'pendientes' (por defecto, pendientes de pago) | 'pagadas' (ya pagadas).
  const [tab, setTab] = useState('pendientes')

  const [view, setView] = useState('list') // list | pago | exito
  const [pedidoSel, setPedidoSel] = useState(null)
  const [resumen, setResumen] = useState(null)

  const cargar = async () => {
    //Al cargar se le hace un fetch al endpoint de mis-reservas segun la solapa activa.
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('ticketmatch-token')
      const res = await fetch(`http://localhost:8080/api/compra/mis-reservas/${tab}`, {
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
    // Se recarga cada vez que cambia la solapa activa.
    Promise.resolve().then(cargar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

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
        onIrAMisEntradas={onIrAMisEntradas}
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

      <div className="reservas-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pendientes'}
          className={`reservas-tab ${tab === 'pendientes' ? 'is-active' : ''}`}
          onClick={() => setTab('pendientes')}
        >
          Pendientes de pago
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pagadas'}
          className={`reservas-tab ${tab === 'pagadas' ? 'is-active' : ''}`}
          onClick={() => setTab('pagadas')}
        >
          Pagadas
        </button>
      </div>

      {loading && <p className="matches-status">Cargando reservas...</p>}

      {!loading && error && <p className="matches-status is-error">{error}</p>}

      {!loading && !error && reservas.length === 0 && (
        <p className="matches-status">
          {tab === 'pendientes'
            ? 'No tenes reservas pendientes de pago.'
            : 'Todavia no tenes compras pagadas.'}
        </p>
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
          <span className="reserva-info-row">
            <CalendarIcon />
            {formatDate(reserva.fechaEncuentro)}
          </span>
          <span className="reserva-info-row">
            <ClockIcon />
            {formatTime(reserva.horaEncuentro)}
          </span>
          <span className="reserva-info-row">
            <PinIcon />
            {reserva.estadio}
          </span>
          <span>{reserva.sector} - {reserva.cantidad} {reserva.cantidad === 1 ? 'entrada' : 'entradas'}</span>
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

function CalendarIcon() {
  return (
    <svg className="reserva-line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h12v14H6z" />
      <path d="M8 3v4M16 3v4M6 9h12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="reserva-line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg className="reserva-line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    </svg>
  )
}

export default MisReservas
