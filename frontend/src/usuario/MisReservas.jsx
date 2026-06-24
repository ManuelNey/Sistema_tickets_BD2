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
    sectores: r.sectores,
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
    <div className="buy-view">
      <div style={{ paddingBottom: 0 }}>
        <header className="buy-header">
          <div>
            <h1 id="dashboard-title">Mis Reservas</h1>
            <p>Historial de reservas y estado de pago</p>
          </div>
        </header>

        <div className="reservas-tabs-new" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pendientes'}
            className={`reservas-tab-new ${tab === 'pendientes' ? 'is-active' : ''}`}
            onClick={() => setTab('pendientes')}
          >
            Pendientes de pago
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pagadas'}
            className={`reservas-tab-new ${tab === 'pagadas' ? 'is-active' : ''}`}
            onClick={() => setTab('pagadas')}
          >
            Pagadas
          </button>
        </div>
        <div className="filters-divider" />
      </div>

      {loading && <p className="matches-status">Cargando reservas...</p>}
      {!loading && error && <p className="matches-status is-error">{error}</p>}
      {!loading && !error && reservas.length === 0 && (
        <p className="matches-status">
          {tab === 'pendientes' ? 'No tenes reservas pendientes de pago.' : 'Todavia no tenes compras pagadas.'}
        </p>
      )}

      <div className="reservas-list-new">
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
  const esPendiente = reserva.estado === 'pendiente'
  const expiraMs = getExpiracion(reserva.fechaReserva)

  const statusMap = {
    pendiente: { bg: '#FFF7ED', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B', color: '#92400E', label: 'Pendiente de pago' },
    pagada:    { bg: '#F0FDF4', border: 'rgba(34,197,94,0.25)',   dot: '#22C55E', color: '#15803D', label: 'Confirmado' },
    cancelada: { bg: '#FEF2F2', border: 'rgba(239,68,68,0.25)',   dot: '#EF4444', color: '#B91C1C', label: 'Cancelada' },
  }
  const st = statusMap[reserva.estado] ?? statusMap.cancelada

  return (
    <article className="reserva-card-new">
      {/* Cabecera oscura */}
      <div className="reserva-card-head-new">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div className="reserva-card-comp">
            <span className="match-competition-dot" />
            Copa Mundial FIFA 2026
          </div>
          <div className="reserva-card-title">{reserva.equipoLocal} vs {reserva.equipoVisitante}</div>
        </div>
        <div style={{ position: 'relative', textAlign: 'right' }}>
          <div className="reserva-card-id-label">Reserva</div>
          <div className="reserva-card-id">{codigoReserva(reserva.idCompra)}</div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="reserva-card-body-new">
        {/* Info izquierda */}
        <div>
          <div className="reserva-card-info-new">
            <div className="reserva-info-row-new">
              <CalSvg />
              <span>{formatDate(reserva.fechaEncuentro)} · {formatTime(reserva.horaEncuentro)}</span>
            </div>
            <div className="reserva-info-row-new">
              <PinSvg />
              <span>{reserva.estadio}</span>
            </div>
            <div className="reserva-info-row-new">
              <TicketSvg />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(reserva.sectores ?? []).map(s => (
                  <span key={s.sector} className="reserva-sector-chip">
                    <span>{s.sector}</span>
                    <span className="reserva-sector-chip-qty">× {s.cantidad}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="reserva-total-label">Total</div>
            <div className="reserva-total-val">{formatPrice(reserva.montoTotal)}</div>
          </div>
        </div>

        {/* Acciones derecha */}
        <div className="reserva-card-side-new">
          <div className="reserva-status-badge" style={{ background: st.bg, borderColor: st.border }}>
            <span className="reserva-status-dot" style={{ background: st.dot }} />
            <span style={{ color: st.color }}>{st.label}</span>
          </div>
          {esPendiente && <Countdown expiraMs={expiraMs} />}

          <div style={{ flex: 1 }} />

          <div className="reserva-card-actions">
            {esPendiente && (
              <>
                <button className="reserva-btn-secondary" type="button" onClick={onCancelar}>Cancelar</button>
                <button className="reserva-btn-primary" type="button" onClick={onPagar}>Pagar ahora</button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function CalSvg() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" /><line x1="1.5" y1="6.5" x2="14.5" y2="6.5" /><line x1="5" y1="1" x2="5" y2="4" /><line x1="11" y1="1" x2="11" y2="4" />
    </svg>
  )
}
function PinSvg() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
      <path d="M8 14.5S2 9.5 2 6a6 6 0 0 1 12 0c0 3.5-6 8.5-6 8.5z" /><circle cx="8" cy="6" r="2" />
    </svg>
  )
}
function TicketSvg() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none', marginTop: 3 }} aria-hidden="true">
      <path d="M2 6.5A1.5 1.5 0 0 1 3.5 5h9A1.5 1.5 0 0 1 14 6.5v.5a1 1 0 0 0 0 2v.5A1.5 1.5 0 0 1 12.5 11h-9A1.5 1.5 0 0 1 2 9.5V9a1 1 0 0 0 0-2v-.5z" />
      <line x1="6.5" y1="5" x2="6.5" y2="11" strokeDasharray="1.5 1.5" />
    </svg>
  )
}

export default MisReservas
