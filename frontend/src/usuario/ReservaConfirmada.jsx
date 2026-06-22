import { useState } from 'react'
import Countdown from './Countdown'
import { formatDate, formatPrice, formatTime, getExpiracion } from './format'

// Pantalla "Reserva Confirmada": resumen + cuenta regresiva de 30 min para pagar.
function ReservaConfirmada({ pedido, onPagar, onPagarMasTarde }) {
  const [expirada, setExpirada] = useState(false)
  const total = pedido.montoTotal
  const expiraMs = getExpiracion(pedido.fechaReserva)

  return (
    <div className="confirmada-view">
      <div className="confirmada-check">
        <BookmarkIcon />
      </div>

      <h1>¡Reserva confirmada!</h1>
      <p className="confirmada-sub">Tenés 30 minutos para pagar o la reserva se cancela.</p>

      
      <Countdown expiraMs={expiraMs} onExpire={() => setExpirada(true)} />

      <article className="resumen-card" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
        <h3>
          <TicketIcon />
          Resumen de la reserva
        </h3>

        <div className="compra-match-hero" style={{ borderRadius: 12, padding: '1rem', margin: '0 0 1rem' }}>
          <p className="competition">Copa Mundial FIFA 2026</p>
          <h2 style={{ margin: '0.25rem 0 0' }}>
            {pedido.equipoLocal} vs {pedido.equipoVisitante}
          </h2>
        </div>

        <dl className="resumen-rows">
          <div>
            <dt>Fecha</dt>
            <dd>{formatDate(pedido.fecha)}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd>{formatTime(pedido.hora)}</dd>
          </div>
          <div>
            <dt>Estadio</dt>
            <dd>{pedido.estadio}</dd>
          </div>
          {(pedido.sectores ?? []).map(s => (
            <div key={s.sector}>
              <dt>{s.sector}</dt>
              <dd>{s.cantidad} {s.cantidad === 1 ? 'entrada' : 'entradas'}</dd>
            </div>
          ))}
        </dl>

        <div className="resumen-total">
          <span>Total a pagar</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      </article>

      <p className="confirmada-codigo">Reserva: {pedido.codigoReserva}</p>

      <div className="confirmada-actions">
        <button className="btn-primary" type="button" onClick={() => onPagar(pedido)} disabled={expirada}>
          <CardIcon />
          {expirada ? 'Reserva expirada' : 'Pagar ahora'}
        </button>
        <button className="btn-secondary" type="button" onClick={onPagarMasTarde}>
          <ClockIcon />
          Pagar mas tarde
        </button>
      </div>
    </div>
  )
}

// Icono de marcador para la reserva confirmada.
function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h12v16l-6-4-6 4V4Z" />
    </svg>
  )
}


// Icono de tarjetita para el botón de pagar.
function TicketIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
    </svg>
  )
}

// Icono de tarjetita para el botón de pagar.
function CardIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
      <path d="M3 6h18v12H3z" />
      <path d="M3 10h18" />
    </svg>
  )
}

// Icono de reloj para el botón de pagar mas tarde.
function ClockIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export default ReservaConfirmada
