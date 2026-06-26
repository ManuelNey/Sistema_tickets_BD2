import { API_URL } from '../config.js'
import { useEffect, useMemo, useState } from 'react'
import { flagUrl } from './teamFlags'
import { fetchComisionVigente, formatDate, formatPrice, formatTime } from './format'

const MAX_ENTRADAS = 5

// Pantalla de compra: grid de sectores con carrito multi-sector.
// El backend acepta una sola habilitación por POST, por eso al confirmar
// se hacen llamadas secuenciales (una por sector seleccionado).
function CompraDetalle({ match, onVolver, onReservaExitosa }) {
  const [sectores, setSectores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // cart: { [idHabilita]: cantidad }
  const [cart, setCart] = useState({})

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Tasa de comisión vigente para el resumen
  const [comisionRate, setComisionRate] = useState(0)

  useEffect(() => {
    fetchComisionVigente().then(setComisionRate)
  }, [])

  useEffect(() => {
    const loadSectores = async () => {
      setError('')
      setLoading(true)
      try {
        const token = localStorage.getItem('ticketmatch-token')
        const res = await fetch(
          `${API_URL}/api/encuentros/${match.idEncuentro}/sectores`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) throw new Error()
        setSectores(await res.json())
      } catch {
        setError('No se pudieron cargar los sectores')
      } finally {
        setLoading(false)
      }
    }
    loadSectores()
  }, [match.idEncuentro])

  const totalEntradas = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart]
  )
  const maxAlcanzado = totalEntradas >= MAX_ENTRADAS

  const cartItems = useMemo(
    () =>
      sectores
        .filter(s => (cart[s.idHabilita] ?? 0) > 0)
        .map(s => ({
          idHabilita: s.idHabilita,
          nombre: s.sector,
          qty: cart[s.idHabilita],
          precio: s.precio,
          subtotal: s.precio * cart[s.idHabilita],
        })),
    [cart, sectores]
  )

  const subtotalTotal = cartItems.reduce((a, i) => a + i.subtotal, 0)
  const cargo = subtotalTotal * comisionRate
  const total = subtotalTotal + cargo

  const addSector = (idHabilita) => {
    if (maxAlcanzado) return
    setCart(c => ({ ...c, [idHabilita]: 1 }))
  }
  const inc = (idHabilita) => {
    if (maxAlcanzado) return
    setCart(c => ({ ...c, [idHabilita]: (c[idHabilita] ?? 0) + 1 }))
  }
  const dec = (idHabilita) => {
    setCart(c => {
      const next = (c[idHabilita] ?? 0) - 1
      if (next <= 0) {
        const next = { ...c }
        delete next[idHabilita]
        return next
      }
      return { ...c, [idHabilita]: next }
    })
  }

  const handleConfirmar = async () => {
    if (cartItems.length === 0) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const token = localStorage.getItem('ticketmatch-token')
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

      // Manda todos los sectores del carrito en una sola llamada; el back crea una compra con toda
      const payload = cartItems.map(item => ({ idHabilita: item.idHabilita, cantidad: item.qty }))
      const res = await fetch(`${API_URL}/api/compra/reservar`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Reserva fallida')
      }
      const { idCompra: idCompraNueva } = await res.json()

      const detalleRes = await fetch(`${API_URL}/api/compra/${idCompraNueva}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!detalleRes.ok) throw new Error('No se pudo obtener el detalle de la reserva.')
      const reserva = await detalleRes.json()
      onReservaExitosa({
        idCompra: idCompraNueva,
        codigoReserva: `RSV-${String(reserva.idCompra).padStart(6, '0')}`,
        equipoLocal: reserva.equipoLocal,
        equipoVisitante: reserva.equipoVisitante,
        fecha: reserva.fechaEncuentro,
        hora: reserva.horaEncuentro,
        estadio: reserva.estadio,
        sectores: reserva.sectores,
        montoTotal: reserva.montoTotal,
        fechaReserva: reserva.fechaReserva,
      })
    } catch (err) {
      setSubmitError(err.message || 'No se pudo completar la reserva. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const url1 = flagUrl(match.equipoLocal)
  const url2 = flagUrl(match.equipoVisitante)

  return (
    <div className="compra-shell">
      {/* Barra superior sticky */}
      <div className="compra-topbar-new">
        <div className="compra-topbar-brand-new">
          <div className="compra-topbar-logo-new">TM</div>
          <div>
            <div className="compra-topbar-title">Comprar Entradas</div>
            <div className="compra-topbar-sub">{match.equipoLocal} vs {match.equipoVisitante}</div>
          </div>
        </div>
        <button className="compra-topbar-volver" type="button" onClick={onVolver}>
          <BackIcon />
          Volver
        </button>
      </div>

      {/* Layout principal */}
      <div className="compra-layout-new">
        {/* Columna izquierda */}
        <div className="compra-left">
          {/* Card del partido */}
          <div className="compra-match-card-new">
            <div className="compra-match-hero-new">
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -10%, rgba(124,58,237,0.16) 0%, transparent 65%)', pointerEvents: 'none' }} />
              <div className="match-competition" style={{ marginBottom: 14 }}>
                <span className="match-competition-dot" />
                Copa Mundial FIFA 2026
              </div>
              <div className="compra-teams-new">
                <div className="match-team">
                  {url1
                    ? <img className="compra-flag" src={url1} alt={match.equipoLocal} />
                    : <span className="compra-flag-fb">{match.equipoLocal.slice(0, 2).toUpperCase()}</span>
                  }
                  <span className="compra-team-name">{match.equipoLocal}</span>
                </div>
                <div className="match-vs-circle">
                  <span>VS</span>
                </div>
                <div className="match-team">
                  {url2
                    ? <img className="compra-flag" src={url2} alt={match.equipoVisitante} />
                    : <span className="compra-flag-fb">{match.equipoVisitante.slice(0, 2).toUpperCase()}</span>
                  }
                  <span className="compra-team-name">{match.equipoVisitante}</span>
                </div>
              </div>
            </div>
            <div className="compra-match-info-row">
              <div className="compra-info-block">
                <CalIcon />
                <div>
                  <span className="compra-info-label">Fecha</span>
                  <strong>{formatDate(match.fecha)}</strong>
                </div>
              </div>
              <div className="compra-info-block">
                <ClockIcon />
                <div>
                  <span className="compra-info-label">Hora</span>
                  <strong>{formatTime(match.hora)}</strong>
                </div>
              </div>
              <div className="compra-info-block">
                <PinIcon />
                <div>
                  <span className="compra-info-label">Estadio</span>
                  <strong>{match.estadio}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de sectores */}
          <div className="compra-sectores-card">
            <div className="compra-sectores-header">
              <div className="compra-sectores-title">Seleccioná tus sectores</div>
              <div className="compra-sectores-sub">Podés combinar sectores · Máximo {MAX_ENTRADAS} entradas en total</div>
            </div>

            {/* Barra de progreso */}
            <div className="compra-progress-wrap">
              <div className="compra-progress-labels">
                <span>Entradas seleccionadas</span>
                <span style={{ color: maxAlcanzado ? '#D97706' : '#7C3AED', fontWeight: 800 }}>
                  {totalEntradas} / {MAX_ENTRADAS}
                </span>
              </div>
              <div className="compra-progress-track">
                <div
                  className="compra-progress-fill"
                  style={{
                    width: `${(totalEntradas / MAX_ENTRADAS) * 100}%`,
                    background: maxAlcanzado ? '#F59E0B' : '#7C3AED',
                  }}
                />
              </div>
            </div>

            {loading && <p className="matches-status" style={{ margin: '0 14px 16px' }}>Cargando sectores...</p>}
            {error && <p className="matches-status is-error" style={{ margin: '0 14px 16px' }}>{error}</p>}

            {!loading && !error && (
              <div className="compra-sector-grid">
                {sectores.length === 0 ? (
                  <p className="matches-status">No hay sectores disponibles.</p>
                ) : (
                  sectores.map(sec => {
                    const qty = cart[sec.idHabilita] ?? 0
                    const seleccionado = qty > 0
                    const agotado = sec.disponibles <= 0
                    const canInc = !maxAlcanzado && !agotado
                    return (
                      <div
                        key={sec.idHabilita}
                        className={`sector-card-new ${seleccionado ? 'is-selected' : ''} ${agotado ? 'is-sold-out' : ''}`}
                      >
                        {seleccionado && (
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(168,85,247,0.03))', pointerEvents: 'none', borderRadius: 'inherit' }} />
                        )}
                        <div className="sector-card-top-new">
                          <div>
                            <div className="sector-name-new">{sec.sector}</div>
                            <div className="sector-avail-new">{agotado ? 'Agotado' : `${sec.disponibles} disponibles`}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="sector-price-new">{formatPrice(sec.precio)}</div>
                            <div className="sector-price-label">por entrada</div>
                          </div>
                        </div>

                        {!seleccionado ? (
                          <button
                            className="sector-add-btn"
                            type="button"
                            disabled={agotado || maxAlcanzado}
                            onClick={() => addSector(sec.idHabilita)}
                          >
                            <PlusIcon />
                            {agotado ? 'Agotado' : maxAlcanzado ? 'Límite alcanzado' : 'Agregar'}
                          </button>
                        ) : (
                          <div className="sector-qty-control">
                            <button type="button" className="sector-qty-btn" onClick={() => dec(sec.idHabilita)} aria-label="Quitar">
                              <MinusIcon />
                            </button>
                            <div style={{ textAlign: 'center' }}>
                              <div className="sector-qty-val">{qty}</div>
                              <div className="sector-qty-label">entrada{qty !== 1 ? 's' : ''}</div>
                            </div>
                            <button
                              type="button"
                              className="sector-qty-btn"
                              disabled={!canInc}
                              onClick={() => canInc && inc(sec.idHabilita)}
                              aria-label="Agregar"
                              style={!canInc ? { opacity: 0.4, cursor: 'not-allowed', borderColor: '#ECEAF2' } : {}}
                            >
                              <PlusIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: resumen sticky */}
        <aside className="compra-resumen-aside">
          <div className="compra-resumen-card">
            <div className="compra-resumen-header">
              <div className="compra-resumen-icon">
                <TicketSmIcon />
              </div>
              <span className="compra-resumen-title">Resumen de Compra</span>
            </div>

            {cartItems.length === 0 ? (
              <div className="compra-resumen-empty">
                <div className="compra-resumen-empty-icon">
                  <TicketGrayIcon />
                </div>
                <div className="compra-resumen-empty-text">Seleccioná al menos<br />un sector para continuar</div>
              </div>
            ) : (
              <>
                <div className="compra-resumen-items">
                  {cartItems.map(item => (
                    <div key={item.idHabilita} className="compra-resumen-item">
                      <div>
                        <div className="compra-resumen-item-name">{item.nombre}</div>
                        <div className="compra-resumen-item-qty">{item.qty} × {formatPrice(item.precio)}</div>
                      </div>
                      <div className="compra-resumen-item-sub">{formatPrice(item.subtotal)}</div>
                    </div>
                  ))}
                </div>

                <div className="compra-resumen-divider" />

                <div className="compra-resumen-totals">
                  <div className="compra-resumen-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotalTotal)}</span>
                  </div>
                  <div className="compra-resumen-row">
                    <span>Comisión ({Math.round(comisionRate * 100)}%)</span>
                    <span>{formatPrice(cargo)}</span>
                  </div>
                  <div className="compra-resumen-divider" style={{ margin: '4px 0' }} />
                  <div className="compra-resumen-row is-total">
                    <span>Total</span>
                    <strong>{formatPrice(total)}</strong>
                  </div>
                </div>

                <div className="compra-resumen-cta-wrap">
                  {submitError && <p className="modal-error" style={{ marginBottom: 8 }}>{submitError}</p>}
                  <button
                    className="compra-resumen-cta"
                    type="button"
                    onClick={handleConfirmar}
                    disabled={submitting}
                  >
                    <LockIcon />
                    {submitting ? 'Reservando...' : 'Confirmar Reserva'}
                  </button>
                  <div className="compra-resumen-timer">Tenés 28 min para completar el pago</div>
                </div>
              </>
            )}
          </div>

          {maxAlcanzado && (
            <div className="compra-max-warning">
              <WarnIcon />
              <span>Límite alcanzado. Máximo {MAX_ENTRADAS} entradas por compra.</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ── Iconos ───────────────────────────────────────────────────── */
function BackIcon() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2L4 6l4 4" />
    </svg>
  )
}
function CalIcon() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1.5" y="2" width="11" height="10" rx="1.5" /><line x1="1.5" y1="5.5" x2="12.5" y2="5.5" /><line x1="4.5" y1="1" x2="4.5" y2="3.5" /><line x1="9.5" y1="1" x2="9.5" y2="3.5" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" /><polyline points="7 4.5 7 7 9 8.5" />
    </svg>
  )
}
function PinIcon() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 13S2 8.5 2 5.5a5 5 0 0 1 10 0C12 8.5 7 13 7 13z" /><circle cx="7" cy="5.5" r="1.5" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  )
}
function MinusIcon() {
  return (
    <svg viewBox="0 0 10 2" width="10" height="2" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="1" y1="1" x2="9" y2="1" />
    </svg>
  )
}
function TicketSmIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 6.5A1.5 1.5 0 0 1 3.5 5h7A1.5 1.5 0 0 1 12 6.5v.4a1 1 0 0 0 0 2v.5A1.5 1.5 0 0 1 10.5 11h-7A1.5 1.5 0 0 1 2 9.5V9a1 1 0 0 0 0-2v-.5z" />
      <path d="M6 5v6" strokeDasharray="1.4 1.4" />
    </svg>
  )
}
function TicketGrayIcon() {
  return (
    <svg viewBox="0 0 18 18" width="20" height="20" fill="none" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 8.5A1.5 1.5 0 0 1 3.5 7h11A1.5 1.5 0 0 1 16 8.5v.5a1.2 1.2 0 0 0 0 2.4v.5A1.5 1.5 0 0 1 14.5 13h-11A1.5 1.5 0 0 1 2 11.5V11a1.2 1.2 0 0 0 0-2.4V8.5z" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="1.5" y="4" width="11" height="9" rx="1.5" /><path d="M4.5 4V3a2.5 2.5 0 0 1 5 0v1" />
    </svg>
  )
}
function WarnIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none', marginTop: 1 }} aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" /><line x1="7" y1="4.5" x2="7" y2="7.5" /><circle cx="7" cy="9.5" r="0.6" fill="#D97706" />
    </svg>
  )
}

export default CompraDetalle
