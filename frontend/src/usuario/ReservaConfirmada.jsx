import Countdown from './Countdown'
import { flagUrl } from './teamFlags'
import { formatDate, formatPrice, formatTime, getExpiracion } from './format'

// Pantalla "Reserva Confirmada": resumen visual con countdown para pagar.
function ReservaConfirmada({ pedido, onPagar, onPagarMasTarde }) {
  const total = pedido.montoTotal
  const expiraMs = getExpiracion(pedido.fechaReserva)
  const flagLocal = flagUrl(pedido.equipoLocal)
  const flagVisitante = flagUrl(pedido.equipoVisitante)

  return (
    <div className="rc-page">
      <div className="rc-inner">

        {/* Hero */}
        <div className="rc-hero">
          <div className="rc-hero-icon">
            <svg viewBox="0 0 20 20" width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 10 8 15 17 5" />
            </svg>
          </div>
          <div className="rc-hero-title">¡Reserva confirmada!</div>
          <div className="rc-hero-sub">Tenés 30 minutos para pagar o la reserva se cancela.</div>
        </div>

        {/* Countdown */}
        <div className="rc-timer-row">
          <Countdown expiraMs={expiraMs} />
        </div>

        {/* Summary card */}
        <div className="rc-card">

          {/* Match header */}
          <div className="rc-match-head">
            <div className="rc-match-comp">
              <span className="rc-comp-dot" />
              Copa Mundial FIFA 2026
            </div>
            <div className="rc-match-teams">
              <div className="rc-team">
                {flagLocal
                  ? <img src={flagLocal} alt="" className="rc-team-flag" />
                  : <span className="rc-team-fallback">{pedido.equipoLocal.slice(0, 2).toUpperCase()}</span>
                }
                <span className="rc-team-name">{pedido.equipoLocal}</span>
              </div>
              <span className="rc-vs">VS</span>
              <div className="rc-team">
                {flagVisitante
                  ? <img src={flagVisitante} alt="" className="rc-team-flag" />
                  : <span className="rc-team-fallback">{pedido.equipoVisitante.slice(0, 2).toUpperCase()}</span>
                }
                <span className="rc-team-name">{pedido.equipoVisitante}</span>
              </div>
            </div>
          </div>

          {/* Info row */}
          <div className="rc-info-row">
            <div className="rc-info-cell">
              <span className="rc-info-lbl">Fecha</span>
              <span className="rc-info-val">{formatDate(pedido.fecha)}</span>
            </div>
            <div className="rc-info-cell rc-info-cell--mid">
              <span className="rc-info-lbl">Hora</span>
              <span className="rc-info-val">{formatTime(pedido.hora)}</span>
            </div>
            <div className="rc-info-cell">
              <span className="rc-info-lbl">Estadio</span>
              <span className="rc-info-val">{pedido.estadio}</span>
            </div>
          </div>

          {/* Sectores */}
          <div className="rc-sectores">
            <div className="rc-sectores-lbl">Entradas</div>
            {(pedido.sectores ?? []).map(s => (
              <div key={s.sector} className="rc-sector-item">
                <div className="rc-sector-icon-wrap">
                  <TicketSmIcon />
                </div>
                <div className="rc-sector-text">
                  <span className="rc-sector-name">{s.sector}</span>
                  <span className="rc-sector-qty">{s.cantidad} {s.cantidad === 1 ? 'entrada' : 'entradas'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total + code */}
          <div className="rc-bottom">
            <div className="rc-total-row">
              <span>Total a pagar</span>
              <span className="rc-total-val">{formatPrice(total)}</span>
            </div>
            <div className="rc-code-wrap">
              <div className="rc-code-pill">
                <OrderSmIcon />
                Reserva: {pedido.codigoReserva}
              </div>
            </div>
          </div>

        </div>

        {/* CTAs */}
        <div className="rc-actions">
          <button className="rc-btn-pay" type="button" onClick={() => onPagar(pedido)}>
            <CardSmIcon />
            Pagar ahora
          </button>
          <button className="rc-btn-later" type="button" onClick={onPagarMasTarde}>
            <ClockSmIcon />
            Pagar más tarde
          </button>
        </div>

      </div>
    </div>
  )
}

function TicketSmIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 6.5A1.5 1.5 0 0 1 3.5 5h7A1.5 1.5 0 0 1 12 6.5v.4a1 1 0 0 0 0 2v.5A1.5 1.5 0 0 1 10.5 11h-7A1.5 1.5 0 0 1 2 9.5V9a1 1 0 0 0 0-2v-.5z" />
    </svg>
  )
}

function OrderSmIcon() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="#B0ACBA" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="2" width="10" height="8" rx="1" />
      <line x1="3" y1="5" x2="9" y2="5" />
      <line x1="3" y1="7.5" x2="7" y2="7.5" />
    </svg>
  )
}

function CardSmIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
      <rect x="1" y="4" width="12" height="9" rx="1.5" />
      <path d="M4 4V3a3 3 0 0 1 6 0v1" />
      <line x1="1" y1="8" x2="13" y2="8" />
    </svg>
  )
}

function ClockSmIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" />
      <polyline points="7 4.5 7 7 9 8.5" />
    </svg>
  )
}

export default ReservaConfirmada
